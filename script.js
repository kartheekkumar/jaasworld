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

function shareProduct(product) {
  const message = `Check this product:\n${product.name}\nPrice: ₹${product.price}`;

  const shareData = {
    title: product.name,
    text: message, // ✅ Ensure text always included
    url: window.location.href,
  };

  // ✅ Try image sharing if supported
  if (navigator.canShare && product.image) {
    fetch(product.image)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `${product.name}.jpg`, {
          type: blob.type,
        });

        if (navigator.canShare({ files: [file] })) {
          shareData.files = [file];

          // ✅ Must reassign text AFTER files (browser bug fix)
          shareData.text = message + "\n\n" + window.location.href;
        }

        navigator.share(shareData).catch(() => {});
      });
  } else {
    // ✅ Normal mobile share
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      // ✅ Desktop fallback
      window.open(
        `https://wa.me/?text=${encodeURIComponent(
          message + "\n" + window.location.href
        )}`,
        "_blank"
      );
    }
  }
}
