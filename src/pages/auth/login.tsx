import { useMutation } from "@apollo/client";
// Chakra imports
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
// Custom components
import { HSeparator } from "components/separator/Separator";
import { setAuthToken } from "graphql/ApolloClient";
import { MUTATION_LOGIN } from "graphql/auth";
import DefaultAuthLayout from "layouts/auth/Default";
// Assets
import Link from "next/link";
import { useRouter } from "next/router";
import { setCookie } from "nookies";
import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";

export default function SignIn() {
  // Chakra color mode
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = "gray.400";
  const textColorDetails = useColorModeValue("navy.700", "secondaryGray.600");
  const textColorBrand = useColorModeValue("brand.500", "white");
  const brandStars = useColorModeValue("brand.500", "brand.400");
  const googleBg = useColorModeValue("secondaryGray.300", "whiteAlpha.200");
  const googleText = useColorModeValue("navy.700", "white");
  const googleHover = useColorModeValue(
    { bg: "gray.200" },
    { bg: "whiteAlpha.300" },
  );
  const googleActive = useColorModeValue(
    { bg: "secondaryGray.300" },
    { bg: "whiteAlpha.200" },
  );

  const [show, setShow] = React.useState(false);
  const handleClick = () => setShow(!show);
  const router = useRouter();
  const toast = useToast();

  const [username, setUsername] = useState(
    process.env.NEXT_PUBLIC_APP_ENV !== "production"
      ? "admin@2easyfreight.com.au"
      : "",
  );
  const [password, setPassword] = useState(
    process.env.NEXT_PUBLIC_APP_ENV !== "production" ? "secret" : "",
  );

  const [handleLogin, { data: loginData, loading, error, reset }] = useMutation(
    MUTATION_LOGIN,
    {
      variables: {
        input: {
          username: username,
          password: password,
        },
      },
      onCompleted: (data) => {
        if (data.login.user.driver?.id == undefined) {
          setCookie(null, "access_token", data.login.access_token, {
            maxAge: 30 * 24 * 60 * 60,
            path: "*",
          });
          setCookie(null, "user_name", data.login.user.name, {
            maxAge: 30 * 24 * 60 * 60,
            path: "*",
          });
          setCookie(null, "user_email", data.login.user.email, {
            maxAge: 30 * 24 * 60 * 60,
            path: "*",
          });
          setCookie(null, "customer_id", data.login.user.customer?.id, {
            maxAge: 30 * 24 * 60 * 60,
            path: "*",
          });
          setCookie(null, "company_id", data.login.user.customer?.company_id, {
            maxAge: 30 * 24 * 60 * 60,
            path: "*",
          });
          setCookie(null, "user_id", data.login.user?.id, {
            maxAge: 30 * 24 * 60 * 60,
            path: "*",
          });
          setCookie(null, "driver_id", data.login.user.driver?.id, {
            maxAge: 30 * 24 * 60 * 60,
            path: "*",
          });
          setCookie(null, "is_admin", data.login.user.is_admin, {
            maxAge: 30 * 24 * 60 * 60,
            path: "*",
          });
          setCookie(
            null,
            "is_company_admin",
            data.login.user.is_company_admin,
            {
              maxAge: 30 * 24 * 60 * 60,
              path: "*",
            },
          );
          setCookie(null, "state", data.login.user.state, {
            maxAge: 30 * 24 * 60 * 60,
            path: "*",
          });
          setAuthToken();

          router.push("/admin/dashboard");
        } else {
          toast({
            title: "Login failed",
            description: "You do not have access to this platform",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      },
      onError: (error) => {
        console.log(error);
        toast({
          title: "Login failed",
          description: "Please check credentials",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      },
    },
  );

  return (
    <DefaultAuthLayout illustrationBackground={"/img/auth/auth.png"}>
      <Box className="flex justify-center items-center w-1/2 min-w-1/2 bg-white">
        <Flex className="h-full w-full flex-col justify-center items-center">
          <Box>
            <Image
              src={"/img/branding/logo-2easy.svg"}
              alt=""
              mb="16"
              maxW="435px"
            />
            <Heading color={textColor} fontSize="24px" mb="45px">
              Log in to your account
            </Heading>

            <Flex
              className="flex-col max-w-full bg-transparent mr-auto"
              zIndex="2"
              w={{ base: "100%", md: "420px" }}
              mx={{ base: "auto", lg: "unset" }}
              mb={{ base: "20px", md: "auto" }}
            >
              <Button
                className="mr-0 mb-6 py-4 h-[50px] !font-medium !text-sm rounded-lg"
                bgColor={googleBg}
                color={googleText}
                _hover={googleHover}
                _active={googleActive}
                _focus={googleActive}
                onClick={() => {
                  toast({
                    title: "Feature in development",
                    description: "TBC",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                  });
                }}
              >
                <Icon as={FcGoogle} w="20px" h="20px" me="10px" />
                Sign in with Google
              </Button>

              <Flex align="center" mb="25px">
                <HSeparator />
                <Text color="black.500" mx="14px">
                  or
                </Text>
                <HSeparator />
              </Flex>

              <FormControl>
                <FormLabel
                  className="!flex ml-1 mb-2 !text-sm !font-medium"
                  color={textColor}
                >
                  Email<Text color={brandStars}>*</Text>
                </FormLabel>
                <Input
                  isRequired={true}
                  variant="auth"
                  type="email"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`mail@${process.env.NEXT_PUBLIC_APP_NAME}.com.au`}
                  className="mb-6 !text-sm !font-medium"
                  ms={{ base: "0px", md: "0px" }}
                  size="lg"
                />

                <FormLabel
                  className="!flex ml-1 mb-2 !text-sm !font-medium"
                  color={textColor}
                >
                  Password<Text color={brandStars}>*</Text>
                </FormLabel>
                <InputGroup size="md">
                  <Input
                    isRequired={true}
                    placeholder="Min. 8 characters"
                    size="lg"
                    type={show ? "text" : "password"}
                    variant="auth"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleLogin();
                      }
                    }}
                    className="mb-6 !text-sm !font-medium"
                  />
                  <InputRightElement
                    display="flex"
                    alignItems="center"
                    mt="4px"
                  >
                    <Icon
                      color={textColorSecondary}
                      _hover={{ cursor: "pointer" }}
                      as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                      onClick={handleClick}
                    />
                  </InputRightElement>
                </InputGroup>

                <Flex justifyContent="space-between" align="center" mb="24px">
                  <FormControl display="flex" alignItems="center">
                    <Checkbox
                      id="remember-login"
                      colorScheme="primary"
                      me="10px"
                    />
                    <FormLabel
                      htmlFor="remember-login"
                      mb="0"
                      fontWeight="normal"
                      color={textColor}
                      fontSize="sm"
                    >
                      Keep me logged in
                    </FormLabel>
                  </FormControl>

                  <Link href="/auth/forgot-password">
                    <Text
                      color={textColorBrand}
                      fontSize="sm"
                      w="124px"
                      fontWeight="700"
                    >
                      Forgot password?
                    </Text>
                  </Link>
                </Flex>

                <Flex>
                  <Button
                    className="!py-2.5 mb-6 !h-[39px] rounded-lg"
                    variant="primary"
                    onClick={() => handleLogin()}
                    isLoading={loading}
                  >
                    Log in
                  </Button>
                </Flex>
              </FormControl>

              <Text
                className="flex text-sm !font-normal"
                color={textColorDetails}
              >
                Not registered yet?
                <Link href="/auth/sign-up">
                  <Text
                    className="ml-[5px] !font-bold"
                    color={textColorBrand}
                    as="span"
                  >
                    Create an Account
                  </Text>
                </Link>
              </Text>
            </Flex>
          </Box>
        </Flex>
      </Box>
    </DefaultAuthLayout>
  );
}
