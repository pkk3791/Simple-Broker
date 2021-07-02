export default (value) => {
  if (value > 1000000) {
    return `${Math.floor(value / 100000) / 10}M`;
  } else if (value > 1000) {
    return `${Math.floor(value / 100) / 10}k`;
  } else {
    return value;
  }
}