import { ethers } from "ethers";
import { createHash, createSign, createVerify } from "crypto";

const verifySignature = (
  publicKey: string,
  message: string,
  signature: string
): boolean => {
  const verifier = createVerify("SHA256");
  verifier.update(message);
  verifier.end();

  return verifier.verify(publicKey, signature, "hex");
};

const signData = (privateKey: string, data: string): string => {
  const sign = createSign("SHA256");
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, "hex");
};

const recoverPublicKey = (signature: string, data: string): string => {
  return ethers.recoverAddress(data, signature);
};

export default {
  recoverPublicKey,
  verifySignature,
  signData,
};
