// module imports
const dayjs = require('dayjs');

exports.getRemainingDays = (date) => {
  const currentDate = dayjs();
  const inputDate = dayjs(date);
  const daysBetween = inputDate.diff(currentDate, 'day');

  return daysBetween;
};

exports.generateDateRange = (startDate, endDate, steps = 1) => {
  const dateArray = [];
  let currentDate = dayjs(startDate);
  const finalDate = dayjs(endDate).add(1, 'day');

  while (currentDate.isBefore(finalDate)) {
    dateArray.push(currentDate.format('YYYY-MM-DD'));
    currentDate = currentDate.add(steps, 'day');
  }

  return dateArray;
};

exports.generatePastDays = (days) => {
  const dates = [];
  const currentDate = dayjs();
  for (let i = 0; i < days; i++) {
    dates.push(currentDate.subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return dates.reverse();
};
