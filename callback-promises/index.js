// 1st
const getData1 = (callback) => {
  setTimeout(() => {
    const data = '1st callback!';
    callback(data);
  }, 1000);
};

getData1((message) => {
  console.log(message);
});

// 2nd
const getData2 = () => {
  return new Promise((resolve, reject) => {
    const isSuccess = true;
    if (!isSuccess) return reject('Custom Error: Something went wrong!');

    setTimeout(() => {
      console.log('2nd Promise');
      resolve();
    }, 1000);
  });
};

getData2()
  .then(() => {
    console.log('2nd Promise resolved');
  })
  .catch((err) => {
    console.log(err);
  });

// 3rd
const getData3 = () => {
  return new Promise((resolve, reject) => {
    const isSuccess = true;
    if (!isSuccess) return reject('Custom Error: Something went wrong!');

    setTimeout(() => {
      console.log('3rd Promise');
      resolve({ userName: 'John', password: '123qwe' });
    }, 1000);
  });
};

getData3()
  .then((data) => {
    console.log('3rd promise resolved');
    console.log(data);
  })
  .catch((err) => {
    console.log(err);
  });

// 4th
const getData4 = () => {
  return new Promise((resolve, reject) => {
    const isSuccess = true;
    if (!isSuccess) return reject('Custom Error: Something went wrong!');

    setTimeout(() => {
      console.log('4th Promise');
      resolve({ userName: 'John', password: '123qwe' });
    }, 1000);
  });
};

(async () => {
  try {
    const res = await getData4();
    console.log('4th promise resolved');
    console.log(res);
  } catch (err) {
    console.log(err);
  }
})();
