
 // Configuração do Supabase
    const SUPABASE_URL = 'https://mzjdmhgkrroajmsfwryu.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16amRtaGdrcnJvYWptc2Z3cnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzMwMzUsImV4cCI6MjA2MzgwOTAzNX0.tQCwUfFCV7sD-IexQviU0XEPcbn9j5uK9NSUbH-OeBc';

    // Inicializa o cliente Supabase de forma segura (evita redeclaração global)
    let supabaseClient = null;
    if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
      supabaseClient = window.supabaseClient;
    } else if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        // cache para evitar re-criação em outros scripts
        window.supabaseClient = supabaseClient;
      } catch (err) {
        // fallback para objeto global
        supabaseClient = window.supabase || null;
      }
    } else if (window.supabaseClient) {
      supabaseClient = window.supabaseClient;
    }

    document.addEventListener('DOMContentLoaded', function () {
      checkExistingAuth();
      // foco no campo de email/username (compatível com diferentes templates)
      const usernameField = document.getElementById('username') || document.getElementById('email');
      if (usernameField) usernameField.focus();
      setupPasswordToggle();
      setupHelperLinks();
      // Liga o listener de submit do formulário de forma robusta
      const loginForm = document.getElementById('loginForm');
      if (loginForm) {
        // previne submit via Enter
        loginForm.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') e.preventDefault();
        });

        // bloqueia submit programático (form.submit()) que alguns navegadores podem disparar
        loginForm.submit = function () {
          console.warn('Blocked programmatic form.submit()');
          return false;
        };

        // attach normal submit handler (will be called when we want)
        loginForm.addEventListener('submit', handleLogin);
      }

      // garante que o clique do botão use JS (evita POST/GET acidental)
      const loginButton = document.getElementById('loginButton') || document.getElementById('submitBtn');
      if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
      }

      // Se a URL tiver credenciais (ex.: ?username=...&password=...), limpa o querystring do histórico
      try {
        const qs = new URLSearchParams(window.location.search);
        if (qs.has('username') || qs.has('password')) {
          console.warn('Querystring contains login fields — clearing from URL');
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      } catch (err) {
        // ignore
      }
    });

    function checkExistingAuth() {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          validateTokenAndRedirect(token);
        } catch (error) {
          clearAuthData();
        }
      }
    }

    function setupPasswordToggle() {
      const toggleButton = document.getElementById('togglePassword');
      const passwordInput = document.getElementById('password');
      const eye = document.getElementById('eyeIcon');
      const eyeOff = document.getElementById('eyeOffIcon');
      if (!toggleButton || !passwordInput) return;
      toggleButton.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        if (eye && eyeOff) {
          eye.classList.toggle('hidden');
          eyeOff.classList.toggle('hidden');
        }
        toggleButton.setAttribute('aria-label', type === 'password' ? 'Mostrar senha' : 'Ocultar senha');
      });
    }

    function setupHelperLinks() {
      const fp = document.getElementById('forgotPassword');
      if (fp) fp.addEventListener('click', function (e) { e.preventDefault(); showMessage('Entre em contato com o administrador para redefinir sua senha.', 'info'); });
      const cs = document.getElementById('contactSupport');
      if (cs) cs.addEventListener('click', function (e) { e.preventDefault(); showMessage('Suporte: suporte@tryviaBI.com.br', 'info'); });
    }

    function validateTokenAndRedirect(token) {
      if (token && token.includes('.')) {
        console.log("Token válido, redirecionamento simulado para portal-clientes.html");
      } else {
        throw new Error('Token inválido');
      }
    }

    async function handleLogin(event) {
      event.preventDefault();
      const emailElem = document.getElementById('username') || document.getElementById('email');
      const email = emailElem ? String(emailElem.value || '').trim() : '';
      console.log('Login attempt for email:', email, 'encoded:', encodeURIComponent(email));

      // Validação básica de email para evitar consultas inválidas ao Supabase/PostgREST
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        showMessage('Email inválido. Verifique o endereço inserido.', 'error');
        console.warn('Email validation failed for:', email);
        setLoadingState(false);
        return false;
      }
      const passwordElem = document.getElementById('password');
      const password = passwordElem ? String(passwordElem.value || '').trim() : '';

      if (!email || !password) {
        showMessage('Por favor, preencha todos os campos.', 'error');
        return false;
      }

      setLoadingState(true);

      try {
        // Consulta o usuário na tabela 'usuarios' pelo email
        const { data, error } = await supabaseClient
          .from('usuarios')
          .select('*')
          .eq('email', email)
          .single();

        if (error || !data) {
          console.error('Supabase query error:', error);
          showMessage('Usuário ou senha incorretos.', 'error');
          document.getElementById('password').value = '';
          document.getElementById('password').focus();
          setLoadingState(false);
          return false;
        }

        // Verifica a senha
        if (data.senha !== password) {
          showMessage('Usuário ou senha incorretos.', 'error');
          document.getElementById('password').value = '';
          document.getElementById('password').focus();
          setLoadingState(false);
          return false;
        }

        // LÓGICA DE REDIRECIONAMENTO CORRIGIDA
        const permissoes = data.permissoes || [];
        const userType = (data.user_type || '').toLowerCase().trim();

        // URL padrão para administradores e usuários internos (ajustada para versão standalone)
        let redirectUrl = '../Portal.html';

        // Verifica se é cliente e redireciona para portal_cliente
        // Baseado na estrutura do banco: user_type com valor padrão 'internal'
        if (userType === 'client' || userType === 'cliente' || userType === 'customer' || userType === 'external') {
          redirectUrl = 'portal_cliente.html';
          console.log('Cliente detectado - redirecionando para portal_cliente.html');
          console.log('Tipo de usuário:', userType);
        } else {
          console.log('Usuário interno detectado - redirecionando para Portal.html');
          console.log('Tipo de usuário:', userType);
        }

        // Debug: mostrar informações completas do usuário
        console.log('=== DEBUG LOGIN ===');
        console.log('Dados do usuário:', {
          nome: data.nome,
          email: email,
          user_type: data.user_type,
          client_id: data.client_id,
          redirectUrl: redirectUrl
        });
        console.log('==================');

        // Gera token e salva dados do usuário
        const fakeToken = generateFakeToken(email);
        storeAuthToken(fakeToken);
        localStorage.setItem('user_id', data.id); // IMPORTANTE: ID do usuário para auditoria
        localStorage.setItem('username', data.nome);
        localStorage.setItem('user_email', email);
        sessionStorage.setItem('tryvia_logged', '1');
        localStorage.setItem('permissoes', JSON.stringify(permissoes));
        localStorage.setItem('user_type', data.user_type || 'internal');
        sessionStorage.setItem('client_id', data.client_id);
        sessionStorage.setItem('setor', data.setor);

        // Atualiza o campo lastLogin no Supabase (se existir)
        try {
          const { error: updateError } = await supabaseClient
            .from('usuarios')
            .update({ lastLogin: new Date().toISOString() })
            .eq('id', data.id);

          if (updateError) {
            console.warn('Erro ao atualizar lastLogin (campo pode não existir):', updateError);
          }
        } catch (updateErr) {
          console.warn('Campo lastLogin não existe na tabela');
        }

        showMessage('Login bem-sucedido! Redirecionando...', 'success');

        // Redirecionamento com delay para mostrar mensagem de sucesso
        setTimeout(() => {
          console.log('Executando redirecionamento para:', redirectUrl);
          window.location.href = redirectUrl;
        }, 800);

      } catch (err) {
        showMessage('Erro ao conectar ao servidor. Tente novamente mais tarde.', 'error');
        console.error('Erro de autenticação:', err);
      } finally {
        setLoadingState(false);
      }

      return false;
    }

    function generateFakeToken(username) {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        sub: username,
        name: `Usuário ${username}`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60)
      }));
      const signature = btoa('fake_signature');
      return `${header}.${payload}.${signature}`;
    }

    function storeAuthToken(token) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_timestamp', Date.now().toString());
    }

    function clearAuthData() {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_timestamp');
      localStorage.removeItem('permissoes');
    }

    function showMessage(message, type = 'error') {
      const errorElement = document.getElementById('errorMessage');
      const successElement = document.getElementById('successMessage');
      errorElement.textContent = '';
      successElement.textContent = '';
      if (type === 'error') {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        successElement.style.display = 'none';
      } else if (type === 'success') {
        successElement.textContent = message;
        successElement.style.display = 'block';
        errorElement.style.display = 'none';
      } else if (type === 'info') {
        successElement.textContent = message;
        successElement.style.display = 'block';
        errorElement.style.display = 'none';
      }
    }

    function setLoadingState(isLoading) {
      const loginButton = document.getElementById('loginButton') || document.getElementById('submitBtn');
      const loadingSpinner = document.getElementById('loadingSpinner') || document.getElementById('btnLoader');
      const buttonText = document.getElementById('btnText') || (loginButton ? loginButton.querySelector('span') : null);
      if (!loginButton) return;
      if (isLoading) {
        loginButton.disabled = true;
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
        if (buttonText) buttonText.textContent = 'Entrando...';
      } else {
        loginButton.disabled = false;
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
        if (buttonText) buttonText.textContent = 'Entrar';
      }
    }