'use client';

import { useState, useEffect } from 'react';

const FREE_PLAN_STUDENT_LIMIT = 50;
const NEAR_LIMIT_THRESHOLD = 40;

export const useStudentLimit = (studentCount: number, isPro: boolean) => {
  const [isStudentLimitReached, setIsStudentLimitReached] = useState(false);
  const [isNearingStudentLimit, setIsNearingStudentLimit] = useState(false);

  useEffect(() => {
    if (!isPro) {
      setIsStudentLimitReached(studentCount >= FREE_PLAN_STUDENT_LIMIT);
      setIsNearingStudentLimit(studentCount >= NEAR_LIMIT_THRESHOLD && studentCount < FREE_PLAN_STUDENT_LIMIT);
    } else {
      setIsStudentLimitReached(false);
      setIsNearingStudentLimit(false);
    }
  }, [studentCount, isPro]);

  return { isStudentLimitReached, isNearingStudentLimit };
};