const firebaseConfig = {
  apiKey: "AIzaSyCzF5bu-YibyR4M6LQCVXiKtaH4UFTI0Bk",
  authDomain: "wanderlust-fc9ed.firebaseapp.com",
  projectId: "wanderlust-fc9ed",
  storageBucket: "wanderlust-fc9ed.firebasestorage.app",
  messagingSenderId: "469528775376",
  appId: "1:469528775376:web:297003ca97192fcc87acd5",
  measurementId: "G-HZK40PQQWW",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

async function handleAuthResponse(response, formId) {
  const form = document.getElementById(formId);
  const button = form.querySelector('button[type="submit"]');
  button.disabled = false;
  button.innerText = formId === "signup-form" ? "Sign Up" : "Login";

  if (response.ok) {
    window.location.href = "/listings";
  } else {
    const errorData = await response.json();
    alert(
      "Authentication failed: " + (errorData.message || "Please try again."),
    );
  }
}

async function registerWithEmail(event) {
  event.preventDefault();
  const form = document.getElementById("signup-form");
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.innerText = "Signing up...";

  const email = form.email.value;
  const password = form.password.value;
  const username = form.username.value;
  const phone = form.phone.value;

  try {
    // 1. Create user in Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password,
    );
    const idToken = await userCredential.user.getIdToken();

    // 2. Send token and user data to our backend to create a local user profile
    const response = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, username, phone }),
    });

    await handleAuthResponse(response, "signup-form");
  } catch (error) {
    button.disabled = false;
    button.innerText = "Sign Up";
    console.error("Firebase Signup Error:", error);
    alert(`Signup failed: ${error.message}`);
  }
}

async function loginWithEmail(event) {
  event.preventDefault();
  const form = document.getElementById("login-form");
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.innerText = "Logging in...";

  const email = form.email.value.trim();
  const password = form.password.value;

  // Basic validation
  if (!email) {
    alert("Please enter your email address.");
    button.disabled = false;
    button.innerText = "Login";
    return;
  }

  if (!password) {
    alert("Please enter your password.");
    button.disabled = false;
    button.innerText = "Login";
    return;
  }

  try {
    // Direct server login for existing users (skip Firebase for login)
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    await handleAuthResponse(response, "login-form");
  } catch (error) {
    button.disabled = false;
    button.innerText = "Login";
    console.error("Login Error:", error);
    alert(`Login failed: ${error.message || "Please try again."}`);
  }
}
