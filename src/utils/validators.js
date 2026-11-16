export const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => password.length >= 8;

export const validateEventForm = (eventData) => {
  const errors = {};
  if (!eventData.title) errors.title = 'Title is required';
  if (!eventData.starts_at) errors.starts_at = 'Start is required';
  if (!eventData.ends_at) errors.ends_at = 'End is required';
  else if (eventData.starts_at && new Date(eventData.ends_at) <= new Date(eventData.starts_at)) {
    errors.ends_at = 'End must be after start';
  }
  if (!eventData.location) errors.location = 'Location is required';
  return { isValid: Object.keys(errors).length === 0, errors };
};
