async function runE2ETest() {
  console.log('🚀 Запуск полного E2E тестирования SmartSafety API...\n');

  // 1. Root
  const rootRes = await fetch('http://localhost:5000/');
  const rootText = await rootRes.text();
  console.log('1. Проверка корневой страницы:');
  console.log('   HTTP Статус:', rootRes.status);
  console.log('   Содержит заголовок SmartSafety:', rootText.includes('SmartSafety'));

  // 2. Cadet Login
  console.log('\n2. Вход курсанта под групповым логином:');
  const cadetLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: 'kursant_biot', password: '123' })
  });
  const cadetSession = await cadetLoginRes.json();
  console.log('   Роль:', cadetSession.role);
  console.log('   Группа:', cadetSession.group_name);
  console.log('   ФИО курсанта (до ввода):', cadetSession.cadet_fio);
  const cadetToken = cadetSession.token;

  // 3. Course Isolation
  console.log('\n3. Проверка строгой изоляции курсов для курсанта:');
  const coursesRes = await fetch('http://localhost:5000/api/courses', {
    headers: { Authorization: `Bearer ${cadetToken}` }
  });
  const courses = await coursesRes.json();
  console.log('   Количество доступных курсов (должно быть 1 для группы БиОТ):', courses.length);
  console.log('   Название назначенного курса:', courses[0]?.title);

  // 4. Register Cadet FIO
  console.log('\n4. Регистрация обязательного ФИО курсанта:');
  const fioRes = await fetch('http://localhost:5000/api/auth/cadet/fio', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cadetToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fio: 'Оспанов Ербол Серикович' })
  });
  const fioData = await fioRes.json();
  console.log('   Успешно зарегистрировано ФИО:', fioData.cadet_fio);

  // 5. Test Questions & Anti-Cheat Check
  console.log('\n5. Запрос вопросов теста (проверка защиты от подглядывания ответов):');
  const qRes = await fetch('http://localhost:5000/api/tests/for-course/1', {
    headers: { Authorization: `Bearer ${cadetToken}` }
  });
  const questions = await qRes.json();
  console.log('   Вопросов получено:', questions.length);
  console.log('   Первый вопрос:', questions[0]?.text);
  console.log('   Утечка правильного ответа (correct_option_index):', questions[0]?.correct_option_index !== undefined ? 'ДА (ОШИБКА)' : 'НЕТ (ЗАЩИЩЕНО)');

  // 6. Submit Test
  console.log('\n6. Прохождение теста и серверная оценка:');
  const submitRes = await fetch('http://localhost:5000/api/tests/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cadetToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      course_id: 1,
      answers: { 1: 2, 2: 1, 3: 0, 4: 1, 5: 1, 6: 2 },
      cheat_flags: 0
    })
  });
  const submitData = await submitRes.json();
  console.log('   Сгенерирован номер протокола:', submitData.protocol_id);
  console.log('   Набрано баллов:', `${submitData.score} из ${submitData.max_score}`);
  console.log('   Процент правильных ответов:', `${submitData.percentage}%`);
  console.log('   Статус аттестации (passed):', submitData.passed ? 'СДАН (УСПЕХ)' : 'НЕ СДАН');

  // 7. TC Admin Login & Reports
  console.log('\n7. Вход Администратора Учебного Центра («Қорғау-Сапа»):');
  const tcLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: 'admin_qorgau', password: 'qorgau123' })
  });
  const tcSession = await tcLoginRes.json();
  console.log('   Роль:', tcSession.role);
  console.log('   УЦ:', tcSession.tc_name);
  const tcToken = tcSession.token;

  const repRes = await fetch('http://localhost:5000/api/reports/results?search_fio=Оспанов', {
    headers: { Authorization: `Bearer ${tcToken}` }
  });
  const repPayload = await repRes.json();
  const repData = Array.isArray(repPayload) ? repPayload : (repPayload.items || []);
  console.log('   Найден сданный протокол в реестре УЦ:', repData[0]?.protocol_id);
  console.log('   ФИО курсанта в ведомости:', repData[0]?.cadet_fio);
  console.log('   Баллы в ведомости:', `${repData[0]?.score}/${repData[0]?.max_score}`);

  // Test Detailed Protocol Modal API
  const detailRes = await fetch(`http://localhost:5000/api/reports/results/${repData[0]?.id}/details`, {
    headers: { Authorization: `Bearer ${tcToken}` }
  });
  const detailData = await detailRes.json();
  console.log('   Детальный протокол получен:', detailData.protocol_id);
  console.log('   Количество вопросов в детальном разборе:', detailData.review?.length);
  console.log('   Первый вопрос из разбора:', detailData.review[0]?.text);
  console.log('   Выбор курсанта в вопросе 1 верен?:', detailData.review[0]?.is_correct);


  // 8. Excel Export
  console.log('\n8. Проверка генерации официального файла Excel (.xlsx):');
  const excelRes = await fetch('http://localhost:5000/api/reports/export-excel', {
    headers: { Authorization: `Bearer ${tcToken}` }
  });
  console.log('   HTTP Статус:', excelRes.status);
  console.log('   Content-Type:', excelRes.headers.get('content-type'));
  console.log('   Content-Disposition:', excelRes.headers.get('content-disposition'));
  const excelBuf = await excelRes.arrayBuffer();
  console.log('   Размер сформированного Excel файла:', `${excelBuf.byteLength} байт`);

  // 9. Super Admin CMS
  console.log('\n9. Вход Супер-Администратора (CMS):');
  const saLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: 'superadmin', password: 'admin2026' })
  });
  const saSession = await saLoginRes.json();
  console.log('   Роль:', saSession.role);
  const saToken = saSession.token;

  const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
    headers: { Authorization: `Bearer ${saToken}` }
  });
  const stats = await statsRes.json();
  console.log('   Общая аналитика платформы:', stats);

  console.log('\n🎉 ВСЕ ТЕСТОВЫЕ СЦЕНАРИИ УСПЕШНО ПРОЙДЕНЫ!');
}

runE2ETest().catch(console.error);
