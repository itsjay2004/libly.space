export const checkOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  // For robust parsing, especially in Safari/iOS, prepend a dummy date part.
  // It's important that the date part is consistent to only compare times.
  const dummyDate = '2000-01-01T';

  const s1 = new Date(dummyDate + start1);
  const e1 = new Date(dummyDate + end1);
  const s2 = new Date(dummyDate + start2);
  const e2 = new Date(dummyDate + end2);

  // Check if any of the date objects are invalid
  if (isNaN(s1.getTime()) || isNaN(e1.getTime()) || isNaN(s2.getTime()) || isNaN(e2.getTime())) {
    // console.error("Invalid Date encountered in checkOverlap:", { start1, end1, start2, end2 });
    return false; // Cannot determine overlap with invalid dates
  }

  // Debugging logs to see the parsed times
  // console.log(`Overlap check: Shift 1 (${start1}-${end1}) -> [${s1.toLocaleTimeString()}, ${e1.toLocaleTimeString()}]`);
  // console.log(`Overlap check: Shift 2 (${start2}-${end2}) -> [${s2.toLocaleTimeString()}, ${e2.toLocaleTimeString()}]`);

  // The core overlap logic
  const overlap = (s1 < e2 && s2 < e1);
  // console.log(`Overlap result: ${overlap}`);
  return overlap;
};
