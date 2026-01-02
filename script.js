// ✅ Slider variables
let sliderImages = [];
let currentSlideIndex = 0;

let allProducts = [];
let filteredProducts = [];
let freeShippingToastShown = false;
let cart = [];

// ✅ Load JSON
fetch("products.json")
  .then((res) => res.json())
  .then((data) => {
    allProducts = data.products;

    // Calculate min and max prices
    const prices = allProducts.map((p) => p.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);

    // Set range input
    const rangeInput = document.getElementById("priceRange");
    rangeInput.min = minP;
    rangeInput.max = maxP;
    rangeInput.value = maxP;

    // Update display
    document.getElementById("maxVal").textContent = maxP;

    // ✅ Always push out-of-stock items to the end on initial load
    allProducts.sort((a, b) => {
      if (a.quantity === 0 && b.quantity > 0) return 1;
      if (a.quantity > 0 && b.quantity === 0) return -1;
      return 0;
    });

    // Show all products initially but keep out-of-stock items pushed to the end
    filteredProducts = allProducts.slice();

    renderProducts(filteredProducts);

    // Event delegation for cart buttons
    document.getElementById("product-list").addEventListener("click", (e) => {
      const target = e.target;
      if (target.classList.contains("qty-minus")) {
        updateCartQty(target.dataset.name, -1);
      } else if (target.classList.contains("qty-plus")) {
        updateCartQty(target.dataset.name, 1);
      } else if (target.classList.contains("add-cart")) {
        updateCartQty(target.dataset.name, 1);
        // Removed openCart to prevent UI jerk
      }
    });
  });

// ✅ Render Products
function renderProducts(list) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  // Update results count
  const countEl = document.getElementById("resultsCount");
  if (countEl) countEl.textContent = `Showing ${list.length} results`;

  list.forEach((p, index) => {
    const encodedName = p.name;
    const isOut = p.quantity === 0;
    const hasSlider = p.sliderImages && p.sliderImages.length > 0;
    const hasTag = p.tag && p.tag.trim() !== "";

    // Infer category
    let category = "Gadgets";
    if (
      p.name.includes("Massager") ||
      p.name.includes("Nebulizer") ||
      p.name.includes("Ear Bottle")
    )
      category = "Health";
    else if (
      p.name.includes("Box") ||
      p.name.includes("Towel") ||
      p.name.includes("Mat") ||
      p.name.includes("Mirror") ||
      p.name.includes("Bottle") ||
      p.name.includes("Coat") ||
      p.name.includes("Luggage")
    )
      category = "Home";
    else if (
      p.name.includes("Brush") ||
      p.name.includes("Wiper") ||
      p.name.includes("Mop") ||
      p.name.includes("Rope")
    )
      category = "Tools";
    else if (
      p.name.includes("Light") ||
      p.name.includes("Lamp") ||
      p.name.includes("Tripod") ||
      p.name.includes("Mic") ||
      p.name.includes("Speaker") ||
      p.name.includes("Pods")
    )
      category = "Electronics";

    const isNew = false; // First 5 are new

    const cartItem = cart.find((i) => i.name === p.name);
    const cartQty = cartItem ? cartItem.qty : 0;

    const card = `
      <div class="product-card ${isOut ? "out-of-stock" : ""}">
        <div class="image-wrapper" style="position:relative;">
          <img src="${p.image}" alt="${
      p.name
    }" class="product-image" loading="lazy" />
          ${isNew ? `<div class="new-badge">NEW</div>` : ""}

          ${
            hasSlider
              ? `<div class="eye-icon" role="button" tabindex="0" aria-label="Open product images" onclick='openImagePopup(${JSON.stringify(
                  p.sliderImages
                )})' onkeydown='if(event.key==="Enter"||event.key===" ") openImagePopup(${JSON.stringify(
                  p.sliderImages
                )})'>👁️</div>`
              : ""
          }

          ${hasTag ? `<div class="tag-badge">${p.tag}</div>` : ""}

          <div class="share-icon" role="button" tabindex="0" aria-label="Share product" onclick='shareProduct(${JSON.stringify(
            p
          )})' onkeydown='if(event.key==="Enter"||event.key===" ") shareProduct(${JSON.stringify(
      p
    )})'><img src="images/share-icon.png" /></div>
        </div>

        <div class="card-content">
          <h3>${p.name}</h3>
          <div class="price">₹${p.price}</div>
          <p class="qty">Available: ${p.quantity}</p>
        </div>

        ${
          isOut
            ? `<button class="buy-btn" disabled>Unavailable</button>`
            : cartQty > 0
            ? `<div class="qty-controls">
                <button class="qty-btn qty-minus" data-name="${encodedName}">-</button>
                <span class="qty-display">${cartQty}</span>
                <button class="qty-btn qty-plus" data-name="${encodedName}">+</button>
              </div>`
            : `<button class="buy-btn add-cart" data-name="${encodedName}">Add to Cart</button>`
        }
      </div>
    `;

    container.innerHTML += card;
  });
}

// ✅ Update Cart Quantity
function updateCartQty(name, delta) {
  cart = JSON.parse(localStorage.getItem("jaas_cart")) || [];
  const itemIndex = cart.findIndex((i) => i.name === name);
  const prod = allProducts.find((p) => p.name === name);
  if (!prod) return;

  if (itemIndex >= 0) {
    const newQty = cart[itemIndex].qty + delta;
    if (newQty <= prod.quantity && newQty > 0) {
      cart[itemIndex].qty = newQty;
    } else if (newQty <= 0) {
      cart.splice(itemIndex, 1);
    } else {
      showToast("Cannot add more than available stock");
      return;
    }
  } else if (delta > 0) {
    if (delta <= prod.quantity) {
      cart.push({ name, qty: delta, price: prod.price, image: prod.image });
    } else {
      showToast("Cannot add more than available stock");
      return;
    }
  }
  localStorage.setItem("jaas_cart", JSON.stringify(cart));
  updateCartCount();

  // Check for free shipping and show toast if unlocked
  const total = cart.reduce((s, it) => s + it.price * it.qty, 0);
  if (total >= 600 && !freeShippingToastShown) {
    showToast("🎉 Free Shipping Unlocked!");
    freeShippingToastShown = true;
  } else if (total < 600) {
    freeShippingToastShown = false;
  }

  // Show/hide free shipping banner on main page
  const mainBanner = document.getElementById("mainFreeShippingBanner");
  if (mainBanner) {
    mainBanner.style.display = total >= 600 ? "block" : "none";
  }

  // Re-render products to reflect cart changes
  renderProducts(filteredProducts);

  // Update cart drawer if open
  if (document.getElementById("cartDrawer").classList.contains("open")) {
    renderCart();
  }
}

// ✅ Show Toast Notification
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ✅ Apply Filters (search + sort + sidebar)
function applyFilters() {
  const searchText = (
    document.getElementById("searchInput").value +
    document.getElementById("sidebarSearch").value
  ).toLowerCase();
  const sortOption = document.getElementById("sortSelect").value;
  const maxPrice = parseInt(document.getElementById("priceRange").value) || 500;
  const selectedCategories = Array.from(
    document.querySelectorAll(".category-filter:checked")
  ).map((cb) => cb.value);
  const inStockOnly = document.getElementById("inStockFilter").checked;

  // Include all products in search results (show out-of-stock items but mark them)
  filteredProducts = allProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchText);
    const matchesPrice = p.price <= maxPrice;
    let category = "Gadgets";
    if (
      p.name.includes("Massager") ||
      p.name.includes("Nebulizer") ||
      p.name.includes("Ear Bottle")
    )
      category = "Health";
    else if (
      p.name.includes("Box") ||
      p.name.includes("Towel") ||
      p.name.includes("Mat") ||
      p.name.includes("Mirror") ||
      p.name.includes("Bottle") ||
      p.name.includes("Coat") ||
      p.name.includes("Luggage")
    )
      category = "Home";
    else if (
      p.name.includes("Brush") ||
      p.name.includes("Wiper") ||
      p.name.includes("Mop") ||
      p.name.includes("Rope")
    )
      category = "Tools";
    else if (
      p.name.includes("Light") ||
      p.name.includes("Lamp") ||
      p.name.includes("Tripod") ||
      p.name.includes("Mic") ||
      p.name.includes("Speaker") ||
      p.name.includes("Pods")
    )
      category = "Electronics";
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(category);
    const matchesStock = !inStockOnly || p.quantity > 0;
    return matchesSearch && matchesPrice && matchesCategory && matchesStock;
  });

  if (sortOption === "low") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOption === "high") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  // Keep out-of-stock items at the end of the list while preserving sort
  filteredProducts.sort((a, b) => (a.quantity === 0) - (b.quantity === 0));

  renderProducts(filteredProducts);
}

// ✅ Search input
document.getElementById("searchInput").addEventListener("input", applyFilters);

// ✅ Sort dropdown
document.getElementById("sortSelect").addEventListener("change", applyFilters);

// ✅ Sidebar search
document
  .getElementById("sidebarSearch")
  .addEventListener("input", applyFilters);

// ✅ Price range
document.getElementById("priceRange").addEventListener("input", function () {
  document.getElementById("maxVal").textContent = this.value;
  applyFilters();
});

// ✅ Categories
document
  .querySelectorAll(".category-filter")
  .forEach((cb) => cb.addEventListener("change", applyFilters));

// ✅ In Stock Filter
document
  .getElementById("inStockFilter")
  .addEventListener("change", applyFilters);

// ✅ Floating Support Button
const supportBtn = document.getElementById("supportBtn");
const supportMenu = document.getElementById("supportMenu");

supportBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  supportMenu.style.display =
    supportMenu.style.display === "flex" ? "none" : "flex";
});

// ✅ Close menu on outside click
document.addEventListener("click", (e) => {
  if (
    supportMenu.style.display === "flex" &&
    !supportMenu.contains(e.target) &&
    e.target !== supportBtn
  ) {
    supportMenu.style.display = "none";
  }
});

// ✅ Mobile Search Sync
document.getElementById("mobileSearch").addEventListener("input", function () {
  document.getElementById("searchInput").value = this.value;
  applyFilters();
});

// ✅ Mobile Sort Sync
document.getElementById("mobileSort").addEventListener("change", function () {
  document.getElementById("sortSelect").value = this.value;
  applyFilters();
});

// ✅ Shipping Popup
const shippingBtn = document.getElementById("shippingBtn");
const shippingPopup = document.getElementById("shippingPopup");
const closeShipping = document.getElementById("closeShipping");

shippingBtn.addEventListener("click", () => {
  shippingPopup.style.display = "flex";
});

closeShipping.addEventListener("click", () => {
  shippingPopup.style.display = "none";
});

shippingPopup.addEventListener("click", (e) => {
  if (e.target === shippingPopup) {
    shippingPopup.style.display = "none";
  }
});

// ✅ ✅ ✅ IMAGE POPUP SLIDER LOGIC
function openImagePopup(images) {
  sliderImages = images;
  currentSlideIndex = 0;

  updatePopupImage();

  document.getElementById("imagePopup").style.display = "flex";
}

function updatePopupImage() {
  const popupImage = document.getElementById("popupImage");
  popupImage.src = sliderImages[currentSlideIndex];
}

// ✅ Close Popup
document.getElementById("closeImagePopup").addEventListener("click", () => {
  document.getElementById("imagePopup").style.display = "none";
});

// ✅ Next Image
document.getElementById("nextImage").addEventListener("click", () => {
  currentSlideIndex = (currentSlideIndex + 1) % sliderImages.length;
  updatePopupImage();
});

// ✅ Previous Image
document.getElementById("prevImage").addEventListener("click", () => {
  currentSlideIndex =
    (currentSlideIndex - 1 + sliderImages.length) % sliderImages.length;
  updatePopupImage();
});

// ✅ Click outside closes popup
document.getElementById("imagePopup").addEventListener("click", (e) => {
  if (e.target.id === "imagePopup") {
    document.getElementById("imagePopup").style.display = "none";
  }
});

// Generate poster-style share image
async function createShareImage(product) {
  return new Promise(async (resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Load product image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = product.image;

    img.onload = () => {
      const imgHeight = 900;
      ctx.drawImage(img, 0, 0, width, imgHeight);

      ctx.textAlign = "center";

      // ✅ Product name
      ctx.fillStyle = "#000";
      ctx.font = "bold 60px Arial";
      ctx.fillText(product.name, width / 2, imgHeight + 120);

      // ✅ Price
      ctx.fillStyle = "green";
      ctx.font = "bold 70px Arial";
      ctx.fillText(`₹${product.price}`, width / 2, imgHeight + 240);

      // ✅ Remove "Buy Now @JaasWorld" completely

      canvas.toBlob(
        (blob) => {
          const file = new File([blob], `${product.name}.jpg`, {
            type: "image/jpeg",
          });
          resolve(file);
        },
        "image/jpeg",
        0.95
      );
    };
  });
}

async function shareProduct(product) {
  const productLink = window.location.href;
  const caption = `${product.name}\nPrice: ₹${product.price}\n${productLink}`;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // ✅ ANDROID — Try IMAGE + TEXT + LINK
  if (!isIOS && isMobile) {
    try {
      const file = await createShareImage(product);

      // ✅ First test full capability: image + text + url
      const fullShare = {
        files: [file],
        text: `${product.name}\nPrice: ₹${product.price}`,
        url: productLink, // ✅ link included
        title: product.name,
      };

      if (navigator.canShare && navigator.canShare(fullShare)) {
        await navigator.share(fullShare);
        return;
      }

      // ✅ If full share not supported → try image + text (no url)
      const imgTextShare = {
        files: [file],
        text: caption, // includes link inside text
        title: product.name,
      };

      if (navigator.canShare && navigator.canShare(imgTextShare)) {
        await navigator.share(imgTextShare);
        return;
      }
    } catch (err) {
      console.log("Android full share failed → using fallback", err);
    }
  }

  // ✅ IPHONE / Other devices — text + url only
  if (navigator.share) {
    try {
      await navigator.share({
        title: product.name,
        text: caption,
        url: productLink,
      });
      return;
    } catch (e) {
      console.log("iOS native share failed → fallback");
    }
  }

  // ✅ DESKTOP fallback (WhatsApp Web)
  window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank");
}

/* ---------------------- Cart Functionality ---------------------- */

function loadCart() {
  try {
    const raw = localStorage.getItem("jaas_cart");
    cart = raw ? JSON.parse(raw) : [];
  } catch (e) {
    cart = [];
  }
  updateCartCount();

  // Show/hide free shipping banner on main page
  const total = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const mainBanner = document.getElementById("mainFreeShippingBanner");
  if (mainBanner) {
    mainBanner.style.display = total >= 600 ? "block" : "none";
  }
  freeShippingToastShown = total >= 600;
}

function saveCart() {
  localStorage.setItem("jaas_cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((s, it) => s + it.qty, 0);
  const el = document.getElementById("cartCount");
  if (el) el.textContent = count;
}

function addToCart(product) {
  if (!product || product.quantity === 0) {
    alert("Product unavailable");
    return;
  }

  const idx = cart.findIndex((c) => c.name === product.name);
  if (idx > -1) {
    // check stock
    const prod = allProducts.find((p) => p.name === product.name) || product;
    if (cart[idx].qty < prod.quantity) {
      cart[idx].qty += 1;
    } else {
      alert("Cannot add more than available stock");
    }
  } else {
    cart.push({
      name: product.name,
      price: product.price,
      qty: 1,
      image: product.image,
    });
  }

  saveCart();
}

function openCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (drawer && overlay) {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    overlay.style.display = "block";
    renderCart();
  }
}

function closeCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (drawer && overlay) {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.style.display = "none";
  }
}

function renderCart() {
  const container = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  if (!container || !totalEl) return;

  container.innerHTML = "";
  let total = 0;
  cart.forEach((it, i) => {
    const subtotal = it.price * it.qty;
    total += subtotal;

    const node = document.createElement("div");
    node.className = "cart-item";
    node.innerHTML = `
      <img src="${it.image}" alt="${it.name}" />
      <div class="meta">
        <h4>${it.name}</h4>
        <div>₹${it.price} each</div>
      </div>
      <div class="qty-controls" data-index="${i}">
        <button class="dec">-</button>
        <div class="qty">${it.qty}</div>
        <button class="inc">+</button>
        <button class="remove">Remove</button>
      </div>
    `;

    container.appendChild(node);
  });

  totalEl.textContent = `₹${total}`;

  const banner = document.getElementById("freeShippingBanner");
  if (total >= 600) {
    banner.style.display = "block";
    if (!freeShippingToastShown) {
      showToast("🎉 Free Shipping Unlocked!");
      freeShippingToastShown = true;
    }
  } else {
    banner.style.display = "none";
    freeShippingToastShown = false;
  }
}

// Event delegation for cart item buttons
document.addEventListener("click", (e) => {
  const target = /** @type {HTMLElement} */ (e.target);

  if (target && target.closest && target.closest(".qty-controls")) {
    const controls = target.closest(".qty-controls");
    const idx = Number(controls.dataset.index);
    if (target.classList.contains("inc")) {
      const prod = allProducts.find((p) => p.name === cart[idx].name);
      if (!prod || cart[idx].qty < prod.quantity) {
        cart[idx].qty += 1;
        saveCart();
        renderCart();
        renderProducts(filteredProducts);
      } else {
        showToast("Reached available stock limit");
      }
    } else if (target.classList.contains("dec")) {
      if (cart[idx].qty > 1) {
        cart[idx].qty -= 1;
        saveCart();
        renderCart();
        renderProducts(filteredProducts);
      } else {
        // remove
        cart.splice(idx, 1);
        saveCart();
        renderCart();
        renderProducts(filteredProducts);
      }
    } else if (target.classList.contains("remove")) {
      cart.splice(idx, 1);
      saveCart();
      renderCart();
      renderProducts(filteredProducts);
    }
  }
});

// Wire up cart open/close and proceed button
document.getElementById("cartButton").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
document.getElementById("cartOverlay").addEventListener("click", closeCart);
document.getElementById("viewCart").addEventListener("click", closeCart); // View Cart closes drawer

document.getElementById("proceedToBuy").addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("Your cart is empty");
    return;
  }

  // Compose whatsapp message with items and totals
  let lines = [];
  let total = 0;
  cart.forEach((it, idx) => {
    const subtotal = it.qty * it.price;
    total += subtotal;
    lines.push(`${idx + 1}. ${it.name} x${it.qty} - ₹${subtotal}`);
  });
  lines.push(`Total: ₹${total}`);

  // Build readable message with raw newlines and encode once
  const messageText = `Hi,\n${lines.join(
    "\n"
  )}\n\nPlease confirm availability and delivery details.`;

  // Open whatsapp with prefilled message to seller number
  const waUrl = `https://wa.me/918548801585?text=${encodeURIComponent(
    messageText
  )}`;
  window.open(waUrl, "_blank");
});

// Replace Buy via WhatsApp links with Add to Cart button when products are rendered
// (ensure cart loads)
loadCart();
