interface ServiceResponse<T> {
  message?: string;
  code: number;
  body?: T;
}

export default ServiceResponse;
