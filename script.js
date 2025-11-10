// ✅ Slider variables
let sliderImages = [];
let currentSlideIndex = 0;

let allProducts = [];
let filteredProducts = [];

// ✅ Load JSON
fetch("products.json")
  .then((res) => res.json())
  .then((data) => {
    allProducts = data.products;
    filteredProducts = [...allProducts];
    renderProducts(filteredProducts);
  });

// ✅ Render Products
function renderProducts(list) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  list.forEach((p) => {
    const encodedName = encodeURIComponent(p.name);
    const isOut = p.quantity === 0;
    const hasSlider = p.sliderImages && p.sliderImages.length > 0;

    const card = `
      <div class="product-card ${isOut ? "out-of-stock" : ""}">
        
        <div class="image-wrapper" style="position:relative;">
          <img src="${p.image}" alt="${p.name}" class="product-image" />

          ${
            hasSlider
              ? `<div class="eye-icon" onclick='openImagePopup(${JSON.stringify(
                  p.sliderImages
                )})'>👁️</div>`
              : ""
          }

          <div class="share-icon" onclick='shareProduct(${JSON.stringify(
            p
          )})'><img src="images/share-icon.png" /></div>
        </div>
        


        <h3>${p.name}</h3>

        ${
          isOut
            ? `<p class="out-stock-text">OUT OF STOCK</p>`
            : `<p class="price">₹${p.price}</p>`
        }

        <p class="qty">Available: ${p.quantity}</p>

        ${
          isOut
            ? `<a class="buy-btn" style="background:#ccc; cursor:not-allowed;">Unavailable</a>`
            : `<a class="buy-btn" href="https://wa.me/918548801585?text=Hi,%20Is%20*${encodedName}*%20available%20for%20purchase?" target="_blank">Buy via WhatsApp</a>`
        }
      </div>
    `;

    container.innerHTML += card;
  });
}

// ✅ Apply Filters (search + sort)
function applyFilters() {
  const searchText = document.getElementById("searchInput").value.toLowerCase();
  const sortOption = document.getElementById("sortSelect").value;

  filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(searchText)
  );

  if (sortOption === "low") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOption === "high") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  renderProducts(filteredProducts);
}

// ✅ Search input
document.getElementById("searchInput").addEventListener("input", applyFilters);

// ✅ Sort dropdown
document.getElementById("sortSelect").addEventListener("change", applyFilters);

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
