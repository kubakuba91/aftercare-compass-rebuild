"use client";

export function LocationStateNote({ stateName, onChangeState }: { stateName: string; onChangeState: () => void }) {
  return (
    <p className="mt-3 text-sm leading-6 text-[#5c6b7a]">
      Showing resources for {stateName} based on your location.{" "}
      <button className="focus-ring rounded-md font-medium text-[#10195e] underline-offset-4 hover:underline" onClick={onChangeState} type="button">
        Change state
      </button>
    </p>
  );
}
