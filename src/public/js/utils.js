export const validateString = (str) => {
  const regex = /^[a-zA-Z][\w.-]{1,15}$/;
  return regex.test(str);
};
