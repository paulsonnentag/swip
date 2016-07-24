const TYPE = {
  JOIN: 'JOIN',
  LEAVE: 'LEAVE',
  SWIPE: 'SWIPE',
};

function join (id, size) {
  return {
    type: TYPE.JOIN,
    data: { id, size },
  };
}

function swipe (id, { position, direction }) {
  return {
    type: TYPE.SWIPE,
    data: { id, position, direction },
  };
}

module.exports = {
  TYPE,
  join,
  swipe,
};
