type Props = {
  evidence: string[];
};

export default function EvidenceList({ evidence }: Props) {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
        検出フレーズ・構造的問題
      </h3>
      <div className="space-y-2">
        {evidence.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-red-400"
          >
            <span className="text-red-400 mt-0.5 flex-shrink-0">⚠</span>
            <p className="text-sm text-gray-700">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
