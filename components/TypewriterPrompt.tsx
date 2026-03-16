import { useState, useEffect, useRef } from "react";

export interface TypewriterMessage {
  text: string;
  action?: { label: string; onClick: () => void };
}

export interface TypewriterSectionItem {
  highlight: string;
  text: string;
}

export interface TypewriterSection {
  label: string;
  items: TypewriterSectionItem[];
}

interface TypewriterPromptProps {
  messages: TypewriterMessage[];
  sections?: TypewriterSection[];
  isLoading?: boolean;
  loadingText?: string;
  onItemClick?: (sectionIndex: number, itemIndex: number) => void;
}

type Mode = "messages" | "loading" | "sections";
type Phase = "typing" | "pausing" | "backspacing" | "done";

const TYPING_SPEED = 60;
const BACKSPACE_SPEED = 35;
const BLINK_DURATION = 530;
const BLINK_PAUSE = BLINK_DURATION * 2;
const SECTION_ITEM_TYPING_SPEED = 30;

interface SectionLine {
  text: string;
  isHeader: boolean;
  highlight?: string;
  sectionIndex: number;
  itemIndex: number;
}

function buildSectionLines(sections: TypewriterSection[]): SectionLine[] {
  const lines: SectionLine[] = [];
  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    lines.push({ text: section.label, isHeader: true, sectionIndex: si, itemIndex: -1 });
    for (let ii = 0; ii < section.items.length; ii++) {
      const item = section.items[ii];
      lines.push({ text: item.highlight + item.text, isHeader: false, highlight: item.highlight, sectionIndex: si, itemIndex: ii });
    }
  }
  return lines;
}

export function TypewriterPrompt({ messages, sections, isLoading, loadingText = "Thinking...", onItemClick }: TypewriterPromptProps) {
  const [mode, setMode] = useState<Mode>("messages");
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const [charIndex, setCharIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sectionTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Section typing state
  const [sectionLines, setSectionLines] = useState<SectionLine[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [lineCharIndex, setLineCharIndex] = useState(0);
  const [sectionsDone, setSectionsDone] = useState(false);

  const msg = messages[messageIndex];
  const fullText = msg ? msg.text + (msg.action?.label ?? "") : "";

  // Transition to loading mode
  useEffect(() => {
    if (isLoading && mode === "messages") {
      setMode("loading");
      setPhase("backspacing");
    }
  }, [isLoading, mode]);

  // Transition to sections mode when sections arrive
  useEffect(() => {
    if (sections && sections.length > 0 && !isLoading) {
      setSectionLines(buildSectionLines(sections));

      if (mode === "loading" || mode === "messages") {
        // Transitioning into sections — animate from start
        setLineIndex(0);
        setLineCharIndex(0);
        setSectionsDone(false);
        setMode("sections");
        setPhase("backspacing");
      }
      // If already in sections mode (e.g. item removed), just update lines
    } else if (mode === "sections" && (!sections || sections.length === 0)) {
      // All items consumed — return to messages prompt
      setSectionLines([]);
      setMode("messages");
      setPhase("done");
      setDisplayText(fullText);
      setCharIndex(fullText.length);
    }
  }, [sections, isLoading, mode]);

  // Main typewriter effect
  useEffect(() => {
    if (mode === "messages") {
      if (!msg) return;
      const isLast = messageIndex === messages.length - 1;

      if (phase === "typing") {
        if (charIndex < fullText.length) {
          timeoutRef.current = setTimeout(() => {
            setDisplayText(fullText.slice(0, charIndex + 1));
            setCharIndex(charIndex + 1);
          }, TYPING_SPEED);
        } else if (isLast) {
          setPhase("done");
        } else {
          setPhase("pausing");
        }
      } else if (phase === "pausing") {
        timeoutRef.current = setTimeout(() => setPhase("backspacing"), BLINK_PAUSE);
      } else if (phase === "backspacing") {
        if (displayText.length > 0) {
          timeoutRef.current = setTimeout(() => {
            setDisplayText(displayText.slice(0, -1));
          }, BACKSPACE_SPEED);
        } else {
          setCharIndex(0);
          setMessageIndex(messageIndex + 1);
          setPhase("typing");
        }
      }
    } else if (mode === "loading") {
      if (phase === "backspacing") {
        if (displayText.length > 0) {
          timeoutRef.current = setTimeout(() => {
            setDisplayText(displayText.slice(0, -1));
          }, BACKSPACE_SPEED);
        } else {
          setCharIndex(0);
          setPhase("typing");
        }
      } else if (phase === "typing") {
        if (charIndex < loadingText.length) {
          timeoutRef.current = setTimeout(() => {
            setDisplayText(loadingText.slice(0, charIndex + 1));
            setCharIndex(charIndex + 1);
          }, TYPING_SPEED);
        } else {
          setPhase("done");
        }
      }
    } else if (mode === "sections") {
      if (phase === "backspacing") {
        if (displayText.length > 0) {
          timeoutRef.current = setTimeout(() => {
            setDisplayText(displayText.slice(0, -1));
          }, BACKSPACE_SPEED);
        } else {
          setPhase("done");
        }
      }
    }

    return () => clearTimeout(timeoutRef.current);
  }, [mode, phase, charIndex, displayText, messageIndex, messages, msg, fullText, loadingText]);

  // Section line-by-line typing
  useEffect(() => {
    if (mode !== "sections" || phase !== "done") return;
    if (sectionLines.length === 0 || sectionsDone) return;

    const currentLine = sectionLines[lineIndex];
    if (!currentLine) {
      setSectionsDone(true);
      return;
    }

    if (lineCharIndex < currentLine.text.length) {
      sectionTimeoutRef.current = setTimeout(() => {
        setLineCharIndex(lineCharIndex + 1);
      }, currentLine.isHeader ? TYPING_SPEED : SECTION_ITEM_TYPING_SPEED);
    } else if (lineIndex < sectionLines.length - 1) {
      sectionTimeoutRef.current = setTimeout(() => {
        setLineIndex(lineIndex + 1);
        setLineCharIndex(0);
      }, 300);
    } else {
      setSectionsDone(true);
    }

    return () => clearTimeout(sectionTimeoutRef.current);
  }, [mode, phase, sectionLines, lineIndex, lineCharIndex, sectionsDone]);

  // Section display
  if (mode === "sections" && phase === "done" && sectionLines.length > 0) {
    const typingActive = !sectionsDone;

    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 space-y-1">
        {sectionLines.map((line, i) => {
          if (i > lineIndex) return null;

          const visible = i < lineIndex ? line.text : line.text.slice(0, lineCharIndex);
          const showCursor = i === lineIndex && typingActive;

          if (line.isHeader) {
            return (
              <div key={i} className="font-semibold text-gray-700 dark:text-gray-300 mt-3 first:mt-0">
                <span>{visible}</span>
                {showCursor && <span className="animate-blink">█</span>}
              </div>
            );
          }

          const highlightLen = line.highlight?.length ?? 0;
          const visibleHighlight = visible.slice(0, highlightLen);
          const visibleRest = visible.slice(highlightLen);
          const fullyTyped = i < lineIndex || sectionsDone;
          const clickable = fullyTyped && onItemClick;

          return (
            <div
              key={i}
              className={`ml-2${clickable ? " cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 rounded px-1 -mx-1 transition-colors" : ""}`}
              onClick={clickable ? () => onItemClick(line.sectionIndex, line.itemIndex) : undefined}
            >
              <span className={`font-medium ${clickable ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>{visibleHighlight}</span>
              <span>{visibleRest}</span>
              {showCursor && <span className="animate-blink">█</span>}
            </div>
          );
        })}
        {sectionsDone && <span className="animate-blink">█</span>}
      </div>
    );
  }

  // Messages and loading: single-line typewriter display
  const action = mode === "messages" && phase === "done" ? msg?.action : undefined;
  const baseText = msg?.text ?? "";

  let textPart: string;
  let actionPart: React.ReactNode = null;

  if (action) {
    textPart = baseText;
    actionPart = (
      <button
        type="button"
        onClick={action.onClick}
        className="underline text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 cursor-pointer"
      >
        {action.label}
      </button>
    );
  } else {
    textPart = displayText;
  }

  return (
    <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
      <span>{textPart}</span>
      {actionPart}
      <span className="animate-blink">█</span>
    </div>
  );
}
