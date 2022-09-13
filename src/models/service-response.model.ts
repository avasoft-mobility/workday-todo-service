interface ServiceResponse<T> {
  code: number;
  message?: string;
  body?: T;
}

export default ServiceResponse;
