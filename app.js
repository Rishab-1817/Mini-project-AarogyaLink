function renderDoctorOptions(doctorList) {
  const select = document.getElementById('docSelect');
  if (!select) return;
  if (!doctorList || doctorList.length === 0) doctorList = doctors;
  select.innerHTML = doctorList
    .map(d => `<option value="${d.id}">${d.name} — ${d.specialty}</option>`)
    .join('');
}

function setDefaultDoctors() {
  renderDoctorOptions(doctors);
}

function findDoctorsBySymptoms() {
  const symptoms = document.getElementById('symptomInput').value || '';
  const resultEl = document.getElementById('symptomMatchResult');

  if (!symptoms.trim()) {
    alert('Please enter symptoms first.');
    if (resultEl) resultEl.innerHTML = '';
    return;
  }

  const matches = getDoctorsBySymptoms(symptoms);
  if (!resultEl) return;

  if (matches.length === 0) {
    resultEl.innerHTML = '<em>No specialist match found. Showing all doctors:</em>';
    renderDoctorOptions(doctors);
  } else {
    resultEl.innerHTML = `✅ Suggested: <strong>${matches[0].name}</strong> (${matches[0].specialty})`;
    renderDoctorOptions(matches);
  }

  document.getElementById('bookBtn').scrollIntoView({ behavior: 'smooth' });
}

function bookAppt() {
  const type = document.getElementById('apptType').value;
  const docId = document.getElementById('docSelect').value;
  const doctor = doctors.find(d => d.id === docId) || { name: docId, specialty: '' };
  const rawDate = document.getElementById('apptDate').value;
  const date = rawDate
    ? new Date(rawDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'N/A';
  const time = document.getElementById('apptTime').value;
  const id = '#ARL' + Math.floor(Math.random() * 9000 + 1000);

  document.getElementById('apptReceipt').innerHTML = `
    👤 <strong>Patient:</strong> ${patient.name}<br>
    🏥 <strong>Doctor:</strong> ${doctor.name} ${doctor.specialty ? '(' + doctor.specialty + ')' : ''}<br>
    📋 <strong>Type:</strong> ${type}<br>
    📅 <strong>Date:</strong> ${date}<br>
    ⏰ <strong>Time:</strong> ${time}<br>
    🔖 <strong>Booking ID:</strong> ${id}<br>
    ✅ <strong>Status:</strong> Confirmed
  `;
  const box = document.getElementById('apptConfirm');
  box.className = 'confirm-box show';
  box.scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  setDefaultDoctors();
  const tomorrow = new Date(Date.now() + 86400000);
  const apptDate = document.getElementById('apptDate');
  if (apptDate) apptDate.valueAsDate = tomorrow;
});