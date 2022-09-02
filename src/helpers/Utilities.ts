const processUTCDateConversion = (date: string) => {
  let dateQuery;
  dateQuery = new Date(date);
  dateQuery = new Date(dateQuery.setDate(dateQuery.getDate() + 1));
  dateQuery = new Date(dateQuery.setHours(0, 0, 0, 0));
  return dateQuery;
};

export default processUTCDateConversion;
