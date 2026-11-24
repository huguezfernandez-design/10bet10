import "server-only";
import type { GameConfig } from "@/server/config-types";

/**
 * ─────────────────────────────────────────────────────────────
 *  TOTI 24 — CONTENIDO POR DEFECTO
 * ─────────────────────────────────────────────────────────────
 *  Todo el contenido editable del juego vive aquí: textos, ciudades,
 *  adivinanzas, objetos, preguntas, puntuaciones y regalos.
 *
 *  Este archivo SOLO se importa en el servidor ("server-only").
 *  El navegador recibe una versión filtrada (sin objetos esperados,
 *  sin puntuaciones y sin regalos). Ver src/server/config.ts → toPublic().
 *
 *  Desde /admin → Contenido se puede sobrescribir cualquier campo sin
 *  tocar código; esos cambios se guardan en la base de datos.
 *
 *  Categorías internas de regalo: DINNER · COMEDY · WINE · GETAWAY
 */
export const DEFAULT_CONFIG: GameConfig = {
  meta: {
    title: "TOTI 24",
    subtitle: "THE ROAD TO MADRID",
    tagline: "24 años. Un viaje pendiente. Cuatro misiones por completar.",
    place: "MADRID",
    year: "2026",
  },

  theme: {
    paper: "#F3F0E9",
    ink: "#171717",
    warm: "#B9B3A8",
    white: "#FFFFFF",
    accent: "#B4532A",
  },

  start: {
    kicker: "Una aventura en cinco destinos",
    body: [
      "Hay viajes que empiezan sin saber muy bien dónde acabarán.",
      "Este es uno de ellos.",
      "Tu misión es llegar desde Gijón hasta Madrid.",
      "Pero antes tendrás que demostrar algunas habilidades, superar diferentes pruebas y tomar ciertas decisiones.",
      "No parece tan complicado, ¿verdad?",
    ],
    cta: "START JOURNEY",
  },

  briefing: {
    lines: [
      "Bueno, parece que tenemos un pequeño viaje pendiente.",
      "Tu objetivo es llegar hasta Madrid. Aunque antes tendrás que hacer algunas paradas.",
      "Prepara tus habilidades, porque esto acaba de empezar.",
    ],
    cta: "LET'S GO",
  },

  stops: [
    {
      id: "gijon",
      name: "Gijón",
      region: "Asturias",
      lon: -5.66,
      lat: 43.54,
      scene: "coast",
      levelLabel: "START",
      travelQuip: "",
      arrivalLine: "Punto de partida. Huele a mar y a sidra.",
    },
    {
      id: "leon",
      name: "León",
      region: "Castilla y León",
      lon: -5.57,
      lat: 42.6,
      scene: "cathedral",
      levelLabel: "LEVEL 01",
      travelQuip: "Saliendo de Asturias. Última oportunidad para un cachopo.",
      arrivalLine: "Catedral gótica, tapas gratis con la caña y una misión esperándote.",
      mission: {
        title: "La herramienta del recuerdo",
        riddle: [
          "Suelo aparecer cuando alguien tiene algo importante que recordar, aunque muchas veces termino olvidado en cualquier cajón.",
          "Tengo tinta, pero no soy un cuadro.",
          "Puedo dejar huella sin necesidad de hablar.",
        ],
        expectedObject: "bolígrafo",
        acceptable: ["boli", "pluma estilográfica", "rotulador de tinta fina", "bolígrafo de cualquier color o marca"],
        rejectExamples: ["lápiz", "pincel", "pintalabios", "lápiz de ojos"],
        successMessage: "Bolígrafo localizado. León queda oficialmente conquistado.",
        errorMessage: "Casi, pero no es exactamente lo que buscamos.",
      },
      question: {
        prompt: "Te encuentras con un día completamente libre y sin ningún compromiso. ¿Qué te apetece más?",
        options: [
          { id: "a", text: "Descubrir algún sitio nuevo que todavía no conoces.", points: { DINNER: 2, GETAWAY: 1 } },
          { id: "b", text: "Hacer algo que te saque una buena carcajada.", points: { COMEDY: 3 } },
          { id: "c", text: "Probar algo diferente y aprender alguna cosa curiosa.", points: { WINE: 3 } },
          { id: "d", text: "Desconectar y olvidarte de la rutina durante un rato.", points: { GETAWAY: 3 } },
        ],
      },
    },
    {
      id: "valladolid",
      name: "Valladolid",
      region: "Castilla y León",
      lon: -4.72,
      lat: 41.65,
      scene: "plaza",
      levelLabel: "LEVEL 02",
      travelQuip: "Tramo recto. Muy recto. Castilla en estado puro.",
      arrivalLine: "Plaza Mayor, mucho frío y gente que habla sorprendentemente bien.",
      mission: {
        title: "El objeto que siempre desaparece",
        riddle: [
          "Vivo en grupo y siempre voy de la mano de alguien.",
          "Sin mí no entras en casa, y justo cuando más me necesitas, desaparezco en el fondo del bolso.",
          "Abro puertas, pero no soy portero.",
        ],
        expectedObject: "llaves",
        acceptable: ["llave", "llavero con llaves", "juego de llaves", "llave de coche"],
        rejectExamples: ["tarjeta", "candado sin llave", "mando de garaje sin llave"],
        successMessage: "Llaves encontradas. Por una vez, a la primera.",
        errorMessage: "Buen intento. Pero eso no abre ninguna puerta.",
      },
      question: {
        prompt:
          "Imagina que mañana tienes una conversación interesante sobre algo que has hecho últimamente. ¿Qué te gustaría contar?",
        options: [
          { id: "a", text: "Que viviste un momento absolutamente surrealista.", points: { COMEDY: 3 } },
          { id: "b", text: "Que te escapaste de la rutina y viviste algo diferente.", points: { GETAWAY: 3 } },
          { id: "c", text: "Que descubriste un sitio espectacular.", points: { DINNER: 3 } },
          { id: "d", text: "Que aprendiste a apreciar algo que antes no valorabas.", points: { WINE: 3 } },
        ],
      },
    },
    {
      id: "segovia",
      name: "Segovia",
      region: "Castilla y León",
      lon: -4.12,
      lat: 40.95,
      scene: "aqueduct",
      levelLabel: "LEVEL 03",
      travelQuip: "Se ve un acueducto a lo lejos. O es un espejismo, o los romanos se pasaron.",
      arrivalLine: "Dos mil años de acueducto. Tú solo tienes que encontrar una cosa.",
      mission: {
        title: "La de una sola oreja",
        riddle: [
          "Tengo una sola oreja y nunca escucho nada.",
          "Por las mañanas soy imprescindible: me llenan, me vacían y vuelta a empezar.",
          "Si me caigo, lo más probable es que acabe en mil pedazos.",
        ],
        expectedObject: "taza",
        acceptable: ["taza de café", "tazón con asa", "mug", "taza de desayuno"],
        rejectExamples: ["vaso sin asa", "copa", "botella", "termo"],
        successMessage: "Taza verificada. El café de mañana ya tiene dónde ir.",
        errorMessage: "Eso no tiene oreja. Vuelve a buscar.",
      },
      question: {
        prompt: "¿Qué ingrediente hace que un plan normal termine convirtiéndose en un planazo?",
        options: [
          { id: "a", text: "Descubrir nuevos sabores y sensaciones.", points: { WINE: 2, DINNER: 1 } },
          { id: "b", text: "La sensación de estar en otro sitio y desconectar.", points: { GETAWAY: 3 } },
          { id: "c", text: "Las risas y la gente.", points: { COMEDY: 3 } },
          { id: "d", text: "El ambiente y el lugar.", points: { DINNER: 3 } },
        ],
      },
    },
    {
      id: "madrid",
      name: "Madrid",
      region: "Comunidad de Madrid",
      lon: -3.7,
      lat: 40.42,
      scene: "capital",
      levelLabel: "LEVEL 04",
      travelQuip: "Cruzando la sierra de Guadarrama. Madrid está ahí abajo. Y alguien más, quizá.",
      arrivalLine: "Destino final. Kilómetro cero.",
      mission: {
        title: "Kilómetro cero",
        riddle: [
          "Tengo manos pero no aplaudo. Tengo cara pero no sonrío.",
          "Siempre voy con prisa, aunque nunca me muevo del sitio.",
          "En Madrid, una noche al año, millones de personas me miran fijamente mientras se atragantan con uvas.",
        ],
        expectedObject: "reloj",
        acceptable: ["reloj de pulsera", "reloj de pared", "despertador", "smartwatch mostrando la hora", "reloj de cocina"],
        rejectExamples: ["móvil", "calendario", "brújula", "pulsera sin reloj"],
        successMessage: "Reloj confirmado. Justo a tiempo.",
        errorMessage: "Eso da la hora, quizá, pero no es lo que buscamos.",
      },
      question: {
        prompt: "Última decisión. Elige una de estas situaciones sin pensártelo demasiado.",
        options: [
          { id: "a", text: "Una experiencia diferente que nunca habías probado.", points: { WINE: 3 } },
          { id: "b", text: "Una noche que empieza con una sorpresa y termina siendo memorable.", points: { DINNER: 3 } },
          { id: "c", text: "Salir sin saber muy bien qué te espera al otro lado.", points: { GETAWAY: 3 } },
          { id: "d", text: "Un rato en el que no puedes parar de reír.", points: { COMEDY: 3 } },
        ],
      },
    },
  ],

  missionUi: {
    destinationReached: "DESTINATION REACHED",
    missionLabel: "MISSION",
    findTitle: "FIND THE OBJECT.",
    findSubtitle: "Cuando lo tengas, demuéstralo.",
    uploadCta: "UPLOAD EVIDENCE",
    takePhoto: "Hacer foto",
    choosePhoto: "Elegir de la galería",
    retake: "Repetir",
    send: "Enviar prueba",
    analyzing: ["ANALYZING EVIDENCE…", "OBJECT DETECTED…", "VERIFYING MISSION…"],
    successTitle: "MISSION COMPLETED",
    retryTitle: "NOT QUITE",
    retryMessage: "Buen intento. Pero creo que puedes hacerlo mejor.",
    questionKicker: "QUICK DECISION",
    continueCta: "CONTINUE",
  },

  madrid: {
    meeting: [
      { speaker: "him", text: "Vaya, parece que has conseguido llegar." },
      { speaker: "her", text: "¿Tú qué haces aquí?" },
      { speaker: "him", text: "Te estaba esperando. Después de tantos kilómetros, ya era hora." },
    ],
    welcomeTitle: "WELCOME TO MADRID.",
    reached: "DESTINATION REACHED.",
    line: "Después de tantos kilómetros, parece que alguien te estaba esperando…",
    finalMissionCta: "ÚLTIMA MISIÓN",
  },

  finale: {
    title: "YOU MADE IT.",
    lines: [
      "Has conseguido completar el recorrido.",
      "Cuatro misiones. Cinco destinos. Algunas decisiones bastante interesantes.",
      "Pero después de analizar tus respuestas, tenemos algo que comunicarte.",
    ],
    suspense: ["Procesando decisiones…", "Consultando con la dirección…", "Vale. Ya está."],
    cta: "VER RESULTADO",
    dedication: {
      button: "UNA ÚLTIMA COSA",
      kicker: "Para Carlota",
      lines: ["Felices 24, Carlotix.", "Por verte cumplir muchos más.", "Te quiero."],
    },
  },

  avatars: {
    her: { name: "Ella", images: {} },
    him: { name: "Él", images: {} },
  },

  // ─── SECRETO: nunca se envía al navegador hasta la revelación final ───
  gifts: {
    DINNER: {
      kicker: "YOUR NEXT DESTINATION",
      headline: "THE TABLE.",
      body: [
        "Está claro que sabes apreciar las cosas buenas.",
        "Prepárate porque nos vamos a cenar a un sitio que merece bastante más que una reseña de Google.",
      ],
      signoff: "Reserva confirmada. Ponte guapa (más).",
      image: "",
      art: "table",
      palette: { bg: "#1E1B18", fg: "#F3F0E9", accent: "#C9A46A" },
      layout: "split",
    },
    COMEDY: {
      kicker: "YOUR NEXT DESTINATION",
      headline: "FRONT ROW.",
      body: [
        "Has demostrado que lo que realmente necesitas es una buena dosis de risas.",
        "Próxima parada: un monólogo. Primera fila, si te atreves.",
      ],
      signoff: "Advertencia: puede que te saquen al escenario.",
      image: "",
      art: "stage",
      palette: { bg: "#171717", fg: "#F3F0E9", accent: "#D9472B" },
      layout: "poster",
    },
    WINE: {
      kicker: "YOUR NEXT DESTINATION",
      headline: "THE WINE EXPERIENCE.",
      body: [
        "Hay que cultivar el paladar, o al menos intentarlo.",
        "Te espera una experiencia para descubrir que no todos los vinos saben igual.",
      ],
      signoff: "Escupir es opcional. Disfrutar, obligatorio.",
      image: "",
      art: "glass",
      palette: { bg: "#3A1420", fg: "#F3F0E9", accent: "#E7C9A9" },
      layout: "frame",
    },
    GETAWAY: {
      kicker: "YOUR NEXT DESTINATION",
      headline: "ESCAPE MODE.",
      body: [
        "Tu subconsciente ha hablado.",
        "Necesitas desconectar, preparar una mochila y desaparecer durante un fin de semana.",
      ],
      signoff: "Destino: secreto. Maleta: pequeña.",
      image: "",
      art: "mountain",
      palette: { bg: "#E8E2D4", fg: "#171717", accent: "#3E5B45" },
      layout: "stack",
    },
  },

  scoring: {
    tieBreakOrder: ["GETAWAY", "DINNER", "WINE", "COMEDY"],
  },
};
