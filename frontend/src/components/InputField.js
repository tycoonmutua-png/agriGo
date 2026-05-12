export default function InputField({ type, placeholder }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="w-full p-4 rounded-2xl bg-[#102742] text-white outline-none border border-[#1F3B5B] mb-4"
    />
  );
}