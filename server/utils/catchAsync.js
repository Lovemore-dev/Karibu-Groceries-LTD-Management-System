module.exports = (fn) => {
  return (req, res, next) => {
    const safeNext =
      typeof next === 'function'
        ? next
        : (err) => {
            throw err;
          };

    return Promise.resolve(fn(req, res, safeNext)).catch(safeNext);
  };
};
