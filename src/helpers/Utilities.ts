import moment from "moment";

const processUTCDateConversion = (date: string) => {
  let dateQuery;
  dateQuery = new Date(date);
  dateQuery = moment(dateQuery).subtract(-1).toDate();
  dateQuery = new Date(dateQuery.setHours(0, 0, 0, 0));
  return dateQuery;
};

export default processUTCDateConversion;
