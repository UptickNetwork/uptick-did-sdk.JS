import { KmsKeyId, KmsKeyType } from './store';

/**
 * KeyProvider is responsible for signing and creation of the keys
 *
 * @public
 * @interface   IKeyProvider
 */
export interface IKeyProvider {
  /**
   * property to store key type
   *
   * @type {KmsKeyType}
   */
  keyType: KmsKeyType;

  /**
   * get all keys
   *
   * @returns list of keys
   */
  list(): Promise<
    {
      alias: string;
      key: string;
    }[]
  >;
  /**
   * gets public key by key id
   *
   * @param {KmsKeyId} keyID - kms key identifier
   * @returns `Promise<PublicKey>`
   */
  publicKey(keyID: KmsKeyId): Promise<string>;
  /**
   * sign data with kms key
   *
   * @param {KmsKeyId} keyId - key identifier
   * @param {Uint8Array} data  - bytes payload
   * @param {{ [key: string]: unknown }} opts  - additional options for signing
   * @returns `Promise<Uint8Array>`
   */
  sign(keyId: KmsKeyId, data: Uint8Array, opts?: { [key: string]: unknown }): Promise<Uint8Array>;

  /**
   * creates new key pair from given seed
   *
   * @param {Uint8Array} seed - seed
   * @returns `Promise<KmsKeyId>`
   */
  newPrivateKeyFromSeed(seed: Uint8Array): Promise<KmsKeyId>;

  /**
   * Verifies a message signature using the provided key ID.
   *
   * @param message - The message bytes to verify.
   * @param signatureHex - The signature in hexadecimal format.
   * @param keyId - The KMS key ID used to verify the signature.
   * @returns A promise that resolves to a boolean indicating whether the signature is valid.
   */
  verify(message: Uint8Array, signatureHex: string, keyId: KmsKeyId): Promise<boolean>;
}
/**
 * Key management system class contains different key providers.
 * allows to register custom provider, create key, get public key and sign
 *
 * @public
 * @class KMS - class
 */
export class KMS {
  private readonly _registry = new Map<KmsKeyType, IKeyProvider>();

  /**
   * register key provider in the KMS
   *
   * @param {KmsKeyType} keyType - kms key type
   * @param {IKeyProvider} keyProvider - key provider implementation
   */
  registerKeyProvider(keyType: KmsKeyType, keyProvider: IKeyProvider): void {
    if (this._registry.get(keyType)) {
      throw new Error('present keyType');
    }
    this._registry.set(keyType, keyProvider);
  }

  /**
   * generates a new key and returns it kms key id
   *
   * @param {KmsKeyType} keyType
   * @param {Uint8Array} bytes
   * @returns kms key id
   */
  async createKeyFromSeed(keyType: KmsKeyType, bytes: Uint8Array): Promise<KmsKeyId> {
    const keyProvider = this._registry.get(keyType);
    if (!keyProvider) {
      throw new Error(`keyProvider not found for: ${keyType}`);
    }
    return keyProvider.newPrivateKeyFromSeed(bytes);
  }

  /**
   * gets public key for key id
   *
   * @param {KmsKeyId} keyId -- key id
   * @returns public key
   */
  async publicKey(keyId: KmsKeyId): Promise<string> {
    const keyProvider = this._registry.get(keyId.type);
    if (!keyProvider) {
      throw new Error(`keyProvider not found for: ${keyId.type}`);
    }

    return keyProvider.publicKey(keyId);
  }

  /**
   * sign Uint8Array with giv KmsKeyIden
   *
   * @param {KmsKeyId} keyId - key id
   * @param {Uint8Array} data - prepared data bytes
   * @returns `Promise<Uint8Array>` - return signature
   */
  async sign(
    keyId: KmsKeyId,
    data: Uint8Array,
    opts?: {
      [key: string]: unknown;
    }
  ): Promise<Uint8Array> {
    const keyProvider = this._registry.get(keyId.type);
    if (!keyProvider) {
      throw new Error(`keyProvider not found for: ${keyId.type}`);
    }

    return keyProvider.sign(keyId, data, opts);
  }

  /**
   * Verifies a signature against the provided data and key ID.
   *
   * @param data - The data to verify the signature against.
   * @param signatureHex - The signature to verify, in hexadecimal format.
   * @param keyId - The key ID to use for verification.
   * @returns A promise that resolves to a boolean indicating whether the signature is valid.
   */
  verify(data: Uint8Array, signatureHex: string, keyId: KmsKeyId): Promise<boolean> {
    const keyProvider = this._registry.get(keyId.type);
    if (!keyProvider) {
      throw new Error(`keyProvider not found for: ${keyId.type}`);
    }
    return keyProvider.verify(data, signatureHex, keyId);
  }

  /**
   * get all keys by key type
   *
   * @param keyType - Key type
   * @returns list of keys
   */
  list(keyType: KmsKeyType): Promise<
    {
      alias: string;
      key: string;
    }[]
  > {
    const keyProvider = this._registry.get(keyType);
    if (!keyProvider) {
      throw new Error(`keyProvider not found for: ${keyType}`);
    }

    return keyProvider.list();
  }
}
