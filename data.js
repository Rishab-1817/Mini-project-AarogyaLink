const patient = {
  name: 'Ramesh Kumar',
  initials: 'RK',
  age: 58,
  conditions: ['Type 2 Diabetes', 'Hypertension'],
};

const doctors = [
  {
    id: 'dr_priya',
    name: 'Dr. Priya Sharma',
    specialty: 'General Physician',
    availability: ['Video Consultation', 'Hospital Visit'],
    keywords: ['fever', 'cough', 'cold', 'headache', 'pain', 'dizziness'],
  },
  {
    id: 'dr_rajesh',
    name: 'Dr. Rajesh Verma',
    specialty: 'Cardiologist',
    availability: ['Hospital Visit', 'Video Consultation'],
    keywords: ['chest', 'heart', 'bp', 'blood pressure', 'palpitation', 'chakkar'],
  },
  {
    id: 'dr_meena',
    name: 'Dr. Meena Gupta',
    specialty: 'Diabetologist',
    availability: ['Video Consultation', 'Home Sample Collection'],
    keywords: ['diabetes', 'sugar', 'thirst', 'urination', 'insulin', 'blood sugar'],
  },
  {
    id: 'dr_sunil',
    name: 'Dr. Sunil Patel',
    specialty: 'Orthopedic',
    availability: ['Hospital Visit', 'Video Consultation'],
    keywords: ['joint', 'bone', 'fracture', 'knee', 'back', 'swelling'],
  },
];

function getDoctorsBySymptoms(symptomsText) {
  const query = (symptomsText || '').toLowerCase().trim();
  if (!query) return [];
  const words = query.split(/\W+/).filter(Boolean);

  return doctors
    .map(doc => {
      const score = doc.keywords.reduce(
        (acc, kw) => acc + ((words.includes(kw) || query.includes(kw)) ? 1 : 0),
        0
      );
      return { ...doc, score };
    })
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score);
}