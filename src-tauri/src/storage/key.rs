use keyring::{Entry, Error};
use zeroize::Zeroizing;

const SERVICE: &str = "com.rubixstudios.ntfy";
const ACCOUNT: &str = "sqlcipher-key-v1";

pub fn database_key(existing_database: bool) -> Result<Zeroizing<String>, String> {
    let entry = Entry::new(SERVICE, ACCOUNT)
        .map_err(|_| "The operating system credential store is unavailable".to_string())?;

    match entry.get_password() {
        Ok(key) if key.len() == 64 && key.bytes().all(|byte| byte.is_ascii_hexdigit()) => {
            Ok(Zeroizing::new(key))
        }

        Ok(_) => Err("The database key in the credential store is invalid".to_string()),
        Err(Error::NoEntry) if !existing_database => {
            let mut bytes = Zeroizing::new([0u8; 32]);

            getrandom::fill(bytes.as_mut())
                .map_err(|_| "Secure random key generation failed".to_string())?;

            let key = Zeroizing::new(bytes.iter().map(|byte| format!("{byte:02x}")).collect::<String>());

            entry.set_password(&key)
                .map_err(|_| "Cannot save the database key in the operating system credential store".to_string())?;

            let stored = Zeroizing::new(entry.get_password()
                .map_err(|_| "Cannot verify the saved database key".to_string())?);

            if *stored != *key {
                return Err("The credential store did not retain the database key".to_string());
            }

            Ok(key)
        }
        Err(Error::NoEntry) => Err("The database key is missing. Restore the original operating system credential or database backup. No data has been reset.".to_string()),
        Err(_) => Err("Unlock the operating system credential store and restart Ntfy. No plaintext fallback is permitted.".to_string()),
    }
}
