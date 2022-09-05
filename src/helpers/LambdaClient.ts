type Services = "Mobile" | "Attendance" | "Todos" | "Reports" | "Users";
const region = process.env.AWS_REGION || "us-west-2";
const Lambda = require("aws-sdk/clients/lambda");

class LambdaClient {
  private baseUrl: string;
  private FunctionName: string;
  private lambda: any;

  constructor(service: Services) {
    this.baseUrl = this.getBaseUrl(service);
    this.FunctionName = this.getFunctionName(service);
    this.lambda = new Lambda({
      region,
      endpoint: this.baseUrl,
    });
  }

  private getBaseUrl = (service: Services): string => {
    if (service === "Mobile") {
      return `${process.env.LAMBDA_BASE_URL}/mobile`;
    }

    if (service === "Attendance") {
      return `${process.env.LAMBDA_BASE_URL}/attendance`;
    }

    if (service === "Reports") {
      return `${process.env.LAMBDA_BASE_URL}/reports`;
    }

    if (service === "Todos") {
      return `${process.env.LAMBDA_BASE_URL}/todos`;
    }

    if (service === "Users") {
      return `${process.env.LAMBDA_BASE_URL}/users`;
    }

    return `${process.env.LAMBDA_BASE_URL}`;
  };

  private getFunctionName = (service: Services): string => {
    if (service === "Mobile") {
      return `AVA-HIVE-NP-WORKDAY-MOBILE-BE-dev-app`;
    }

    if (service === "Attendance") {
      return `AVA-HIVE-NP-WORKDAY-ATTENDANCE-BE-dev-app`;
    }

    if (service === "Reports") {
      return `AVA-HIVE-NP-WORKDAY-REPORTS-BE-dev-app`;
    }

    if (service === "Todos") {
      return `AVA-HIVE-NP-WORKDAY-TODOS-BE-dev-app`;
    }

    if (service === "Users") {
      return `AVA-HIVE-NP-WORKDAY-USERS-BE-dev-app`;
    }

    return `AVA-HIVE-NP-WORKDAY-TODOS-BE-dev-app`;
  };

  get = (route: string, queryParams?: Object) => {
    const Payload = {
      httpMethod: "GET",
      path: route,
      headers: { "content-type": "application/json" },
      queryParams: queryParams ? queryParams : {},
      isBase64Encoded: false,
    };
    return this.lambda
      .invoke({
        Payload: JSON.stringify(Payload),
        FunctionName: this.FunctionName,
      })
      .promise();
  };

  post = (route: string, queryParams?: Object, body?: Object) => {
    const Payload = {
      httpMethod: "POST",
      path: route,
      headers: { "content-type": "application/json" },
      queryParams: queryParams ? queryParams : {},
      isBase64Encoded: false,
      body: body ? body : {},
    };

    return this.lambda
      .invoke({
        Payload: JSON.stringify(Payload),
        FunctionName: this.FunctionName,
      })
      .promise();
  };

  put = (route: string, queryParams?: Object, body?: Object) => {
    const Payload = {
      httpMethod: "PUT",
      path: route,
      headers: { "content-type": "application/json" },
      queryParams: queryParams ? queryParams : {},
      isBase64Encoded: false,
      body: body ? body : {},
    };

    return this.lambda
      .invoke({
        Payload: JSON.stringify(Payload),
        FunctionName: this.FunctionName,
      })
      .promise();
  };

  delete = (route: string, queryParams?: Object, body?: Object) => {
    const Payload = {
      httpMethod: "DELETE",
      path: route,
      headers: { "content-type": "application/json" },
      queryParams: queryParams ? queryParams : {},
      isBase64Encoded: false,
      body: body ? body : {},
    };

    return this.lambda
      .invoke({
        Payload: JSON.stringify(Payload),
        FunctionName: this.FunctionName,
      })
      .promise();
  };
}

export default LambdaClient;
