#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    unsafe {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    let runtime = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .thread_name("ntfy-worker")
        .thread_stack_size(8 * 1024 * 1024)
        .build()
        .expect("Cannot initialise the Ntfy async runtime");

    tauri::async_runtime::set(runtime.handle().clone());

    ntfy_core::run();

    drop(runtime);
}
