export default function PrimaryButton({ text }) {
  return (
    <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold mt-3">
      {text}
    </button>
  );
}