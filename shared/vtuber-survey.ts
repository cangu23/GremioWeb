// ========================================
// VTuber Application Survey Questions
// ========================================
// Estas preguntas ayudan a los admins a evaluar
// si un solicitante es apto para ser VTuber oficial.
// ========================================

export interface SurveyQuestion {
  id: string;
  question: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
}

export const VTUBER_SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'equipment',
    question: '🎙️ ¿Tienes equipo para hacer streams?',
    placeholder: 'Describe tu equipo: micrófono, cámara, PC, etc.',
    required: true,
    type: 'textarea',
  },
  {
    id: 'experience',
    question: '🎮 ¿Tienes experiencia previa haciendo streams o contenido?',
    placeholder: 'Cuéntanos tu experiencia: plataformas, seguidores, etc.',
    required: true,
    type: 'textarea',
  },
  {
    id: 'model',
    question: '🎭 ¿Tienes un modelo/avatar VTuber o planeas crear uno?',
    placeholder: 'Live2D, 3D, PNGTuber, etc.',
    required: true,
    type: 'textarea',
  },
  {
    id: 'contentType',
    question: '📺 ¿Qué tipo de contenido planeas hacer?',
    placeholder: 'Gaming, música, arte, charlas, ASMR, etc.',
    required: true,
    type: 'textarea',
  },
  {
    id: 'dedication',
    question: '⏰ ¿Cuántas horas a la semana puedes dedicar a crear contenido?',
    placeholder: 'Ej: 10-15 horas',
    required: true,
    type: 'text',
  },
  {
    id: 'socialMedia',
    question: '🔗 ¿Tienes redes sociales activas donde promocionar tu contenido?',
    placeholder: 'Twitch, YouTube, Twitter/X, TikTok, etc.',
    required: true,
    type: 'textarea',
  },
  {
    id: 'motivation',
    question: '⭐ ¿Por qué quieres ser VTuber oficial en Gremio Estelar?',
    placeholder: 'Cuéntanos tu motivación y qué aportarías a la comunidad...',
    required: true,
    type: 'textarea',
  },
];

/** Resultado de la encuesta — se guarda como JSON en VtuberRequest.surveyAnswers */
export type SurveyAnswers = Record<string, string>;
