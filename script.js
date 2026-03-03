const SUPABASE_URL = 'TU_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let usuarioActual = null;
let sessionCounter = 1;
setInterval(()=>{ document.getElementById("reloj").textContent = new Date().toLocaleTimeString(); }, 1000);

async function entrar(){
  const email = document.getElementById("user").value;
  const password = document.getElementById("pass").value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if(error){ document.getElementById("login-msg").textContent = "Acceso denegado"; return; }
  usuarioActual = data.user;
  document.getElementById("login-msg").textContent = "Acceso concedido";
  setTimeout(()=>mostrarMain(), 500);
}

function mostrarMain(){
  document.getElementById("login-container").style.display="none";
  document.getElementById("main-container").style.display="block";
  document.getElementById("usuario").textContent = usuarioActual.email;
  document.getElementById("session-num").textContent = "Sesión "+sessionCounter++;
  mostrarDocumentos();
}

async function logout(){
  await supabase.auth.signOut();
  document.getElementById("main-container").style.display="none";
  document.getElementById("login-container").style.display="block";
  document.getElementById("login-msg").textContent = "";
}

async function mostrarDocumentos(){
  document.getElementById("content").innerHTML = '<div class="table-header"><div>Nombre</div><div>Acción</div></div>';
  const { data:files } = await supabase.storage.from('documentos').list('');
  files.forEach(file=>{
    const row = document.createElement('div');
    row.className="table-row";
    row.innerHTML = '<div>'+file.name+'</div><div><button onclick="descargarArchivo(\''+file.name+'\')">Descargar</button> <button onclick="eliminarArchivo(\''+file.name+'\')">Eliminar</button></div>';
    document.getElementById("content").appendChild(row);
  });
}

async function descargarArchivo(name){
  const { data, error } = await supabase.storage.from('documentos').download(name);
  if(error){ alert(error.message); return; }
  const url = URL.createObjectURL(data);
  const a = document.createElement('a'); a.href=url; a.download=name; a.click();
}

async function eliminarArchivo(name){
  if(!confirm("Desea eliminar este documento?")) return;
  const { error } = await supabase.storage.from('documentos').remove([name]);
  if(error) alert(error.message);
  mostrarDocumentos();
}

async function mostrarHerramientas(){
  document.getElementById("content").innerHTML = '<h3>Herramientas de Administración</h3><input type="email" id="nuevoUsuario" placeholder="Correo"><input type="password" id="passUsuario" placeholder="Contraseña"><select id="nivelUsuario"><option value="1">Admin</option><option value="2">Modificar Archivos</option><option value="3">Solo Lectura</option></select><button onclick="crearUsuario()">Crear Usuario</button><h4>Usuarios</h4><div id="usuarios-lista"></div>';
  listarUsuarios();
}

async function crearUsuario(){
  const email = document.getElementById("nuevoUsuario").value;
  const password = document.getElementById("passUsuario").value;
  const nivel = document.getElementById("nivelUsuario").value;
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if(error){ alert(error.message); return; }
  await supabase.from('roles').insert([{id_usuario:data.user.id,nivel:nivel}]);
  listarUsuarios();
}

async function listarUsuarios(){
  const { data:users } = await supabase.auth.admin.listUsers();
  const { data:roles } = await supabase.from('roles').select('*');
  const cont = document.getElementById("usuarios-lista"); cont.innerHTML='';
  users.forEach(u=>{
    if(u.email===usuarioActual.email) return;
    const rol = roles.find(r=>r.id_usuario===u.id) || {nivel:3};
    const div = document.createElement('div');
    div.innerHTML = u.email+' (Nivel '+rol.nivel+') <button onclick="borrarUsuario(\''+u.id+'\')">Borrar</button> <button onclick="banearUsuario(\''+u.id+'\')">Banear</button> <button onclick="desbanearUsuario(\''+u.id+'\')">Quitar Baneo</button>';
    cont.appendChild(div);
  });
}

async function borrarUsuario(id){ if(!confirm("Desea eliminar este usuario?")) return; await supabase.auth.admin.deleteUser(id); await supabase.from('roles').delete().eq('id_usuario',id); listarUsuarios(); }
async function banearUsuario(id){ await supabase.from('roles').update({baneado:true}).eq('id_usuario',id); listarUsuarios(); }
async function desbanearUsuario(id){ await supabase.from('roles').update({baneado:false}).eq('id_usuario',id); listarUsuarios(); }
