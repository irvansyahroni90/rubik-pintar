// Daftar kursus. 4x4 ditaruh paling depan.
import { COURSE, QUIZ_KEYS } from './course.js';
import { COURSE4, QUIZ_KEYS4 } from './course4.js';

export const COURSES = {
  '4x4': {
    id: '4x4', N: 4, title: 'Kursus 4x4',
    blurb: 'Metode reduksi untuk pemula: bangun center, pasangkan edge, selesaikan seperti 3x3, lalu atasi parity.',
    lessons: COURSE4, quizKeys: QUIZ_KEYS4,
  },
  '3x3': {
    id: '3x3', N: 3, title: 'Kursus Pemula 3x3',
    blurb: '8 tahap metode lapisan. Juga dipakai di tahap akhir kubus 4x4.',
    lessons: COURSE, quizKeys: QUIZ_KEYS,
  },
};
export const COURSE_ORDER = ['4x4', '3x3'];

// Kemajuan kursus 3x3 lama disimpan tanpa awalan; kursus lain memakai "4x4:id"
export const progressKey = (courseId, lessonId) => (courseId === '3x3' ? lessonId : `${courseId}:${lessonId}`);
