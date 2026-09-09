import { db } from '../db/db.js';
import type { AuthSession } from '../types.js';

export type CourseRow = {
  id: number;
  title: string;
  category: string;
  code: string;
  description: string;
  duration_hours: number;
  slides_json: string;
  text_content: string;
  video_url: string;
  owner_tc_id: number | null;
};

export const COURSE_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{1,31}$/;

export function getCourseById(courseId: number): CourseRow | undefined {
  return db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as CourseRow | undefined;
}

export function canWriteCourse(session: AuthSession, course: { owner_tc_id?: number | null }): boolean {
  if (session.role === 'super_admin') return true;
  return Boolean(
    session.role === 'tc_admin' &&
    session.tc_id &&
    course.owner_tc_id === session.tc_id
  );
}

export function defaultCourseSlides(title: string) {
  return [
    {
      id: 1,
      title: `Вводная часть: ${title}`,
      subtitle: 'Нормативные основы Республики Казахстан',
      content: [
        'Цели обучения и область применения программы.',
        'Обязанности работодателя и работника в области охраны труда.',
        'Порядок проверки знаний и допуска к самостоятельной работе.'
      ],
      law_reference: 'Трудовой кодекс РК ст. 79, 181, 182',
      warning: 'Допуск к работе лиц, не прошедших обучение и проверку знаний, запрещён.'
    }
  ];
}

export function normalizeSlidesJson(slides: unknown, title: string): string {
  let parsed: any = slides;
  if (typeof slides === 'string') {
    try {
      parsed = JSON.parse(slides);
    } catch {
      parsed = [];
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    parsed = defaultCourseSlides(title);
  }

  const normalized = parsed.map((slide: any, index: number) => {
    const content = Array.isArray(slide?.content)
      ? slide.content.map((line: unknown) => String(line).trim()).filter(Boolean)
      : String(slide?.content || '')
          .split('\n')
          .map((line: string) => line.trim())
          .filter(Boolean);

    return {
      id: Number(slide?.id) || index + 1,
      title: String(slide?.title || `Слайд ${index + 1}`).trim(),
      subtitle: String(slide?.subtitle || '').trim(),
      content: content.length > 0 ? content : ['Тезис учебного материала.'],
      law_reference: String(slide?.law_reference || '').trim(),
      warning: String(slide?.warning || '').trim()
    };
  });

  return JSON.stringify(normalized);
}

export function assignCourseToTcGroups(courseId: number, tcId: number, groupIds: unknown) {
  const unique = [...new Set(
    (Array.isArray(groupIds) ? groupIds : [])
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0)
  )];

  for (const groupId of unique) {
    const group = db.prepare('SELECT id FROM groups WHERE id = ? AND tc_id = ?').get(groupId, tcId);
    if (!group) {
      const err = new Error('Группа не принадлежит вашему учебному центру') as Error & { status?: number };
      err.status = 403;
      throw err;
    }
  }

  db.prepare(`
    DELETE FROM group_courses
    WHERE course_id = ? AND group_id IN (SELECT id FROM groups WHERE tc_id = ?)
  `).run(courseId, tcId);

  const insert = db.prepare('INSERT INTO group_courses (group_id, course_id) VALUES (?, ?)');
  for (const groupId of unique) {
    insert.run(groupId, courseId);
  }
}
