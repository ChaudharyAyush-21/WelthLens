"use client";
import { useEffect, useState } from "react";
import Vapi from "@vapi-ai/web";

export default function VapiPage() {
  const [callState, setCallState] = useState("idle"); // idle, connecting, connected, ending

  useEffect(() => {
    const vapi = new Vapi("eaca5422-eca6-4653-92fc-8ec899e6cebf");
    const assistantId = "d449af11-736a-41c6-8950-4fb38b96e801";

    // Store vapi instance for button click handler
    window.vapiInstance = vapi;

    vapi.on("call-start", () => {
      console.log("Call Started");
      setCallState("connected");
    });

    vapi.on("call-end", () => {
      console.log("Call Ended");
      setCallState("idle");
    });

    vapi.on("speech-start", () => {
      console.log("Assistant is speaking...");
    });

    vapi.on("speech-end", () => {
      console.log("Assistant finished speaking.");
    });

    vapi.on("message", (msg) => {
      if (msg.type !== "transcript") return;

      if (msg.transcriptType === "partial") {
        console.log("Partial transcript:", msg.text);
      }

      if (msg.transcriptType === "final") {
        console.log("Final transcript:", msg.text);
      }
    });

    vapi.on("message", (msg) => {
      if (msg.type !== "function-call") return;

      if (msg.functionCall.name === "addTopping") {
        const topping = msg.functionCall.parameters.topping;
        console.log("Add topping:", topping);
      }

      if (msg.functionCall.name === "goToCheckout") {
        console.log("Redirecting to checkout...");
      }
    });

    return () => {
      window.vapiInstance = null;
    };
  }, []);

  const handleCallToggle = async () => {
    const vapi = window.vapiInstance;
    if (!vapi) return;

    const assistantId = "d449af11-736a-41c6-8950-4fb38b96e801";

    if (callState === "idle") {
      setCallState("connecting");
      try {
        await vapi.start(assistantId);
      } catch (error) {
        console.error("Failed to start call:", error);
        setCallState("idle");
      }
    } else if (callState === "connected") {
      setCallState("ending");
      try {
        await vapi.stop();
      } catch (error) {
        console.error("Failed to stop call:", error);
        setCallState("connected");
      }
    }
  };

  const getButtonConfig = () => {
    switch (callState) {
      case "idle":
        return {
          text: "Start Call",
          bgColor: "bg-blue-600 hover:bg-blue-700",
          disabled: false
        };
      case "connecting":
        return {
          text: "Connecting...",
          bgColor: "bg-yellow-500",
          disabled: true
        };
      case "connected":
        return {
          text: "End Call",
          bgColor: "bg-red-600 hover:bg-red-700",
          disabled: false
        };
      case "ending":
        return {
          text: "Ending...",
          bgColor: "bg-gray-500",
          disabled: true
        };
      default:
        return {
          text: "Start Call",
          bgColor: "bg-blue-600 hover:bg-blue-700",
          disabled: false
        };
    }
  };

  const config = getButtonConfig();

  return (
    <div className="flex items-center justify-center p-4">
      <button
        onClick={handleCallToggle}
        disabled={config.disabled}
        className={`
          px-6 py-2 rounded-lg text-white font-medium
          ${config.bgColor}
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-sm hover:shadow-md
        `}
      >
        {config.text}
        {callState === "connected" && (
          <span className="ml-2 w-2 h-2 bg-white rounded-full inline-block animate-pulse"></span>
        )}
      </button>
    </div>
  );
}