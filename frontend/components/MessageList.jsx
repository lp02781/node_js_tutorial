export default function MessageList({ messages }) {
  return (
    <ul>
      {messages.map((m) => (
        <li key={m.id}>{m.type}: {m.text}</li>
      ))}
    </ul>
  );
}
