const awsconfig = {
    aws_project_region: "us-east-1",
    aws_cognito_region: "us-east-1",
    aws_user_pools_id: "us-east-1_4UCxyTaUV",
    aws_user_pools_web_client_id: "5eqdqq0ou2kl8gkah8qusddo1i",
    aws_identity_pool_id: "us-east-1:8b4ac1ac-b1f9-4ec9-89ab-f997673b6b14",
    oauth: {
      domain: "us-east-14ucxytauv.auth.us-east-1.amazoncognito.com",
      scope: ["email", "openid", "profile"],
      redirectSignIn: "https://app.jasonofbh.net/",
      redirectSignOut: "https://app.jasonofbh.net/",
      responseType: "code",
    },
  };
  
  export default awsconfig;
  