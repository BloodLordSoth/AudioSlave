const form = document.getElementById("form");
const username = document.getElementById("username");
const password = document.getElementById("password");
const text = document.getElementById("text");

async function submit() {
  if (username.value.length === 0 || password.value.length === 0) {
    window.alert("Username and Password required.");
    return;
  }

  const dataObj = {
    username: username.value,
    password: password.value,
  };

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataObj),
  });

  if (!res.ok) {
    text.style.display = "flex";
    setTimeout(() => {
      text.style.display = "none";
      password.value = "";
    }, 3000);
    return;
  }

  const bell = await res.json();
  localStorage.setItem("accessToken", bell.accessToken);
  localStorage.setItem("username", bell.name);
  const token = localStorage.getItem("accessToken");

  await fetch("/dashboard", {
    method: "GET",
    headers: { authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    window.location.href = "./secure/dashboard.html";
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  submit();
});

window.addEventListener("load", () => {
  username.value = "";
  password.value = "";
});
