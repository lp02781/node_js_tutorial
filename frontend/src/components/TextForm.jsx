import { useState } from "react";

// Reusable "input + button" form, used for both tasks and messages.
// The input is "controlled": its value lives in React state, not the DOM.
export default function TextForm({ placeholder, buttonLabel, maxLength, onSubmit }) {
  const [value, setValue] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    if (onSubmit(text)) setValue("");  // clear only if it was sent
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        required
      />
      <button type="submit">{buttonLabel}</button>
    </form>
  );
}
