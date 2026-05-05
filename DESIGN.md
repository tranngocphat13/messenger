---
name: Messenger Redesign Expert Edition
project_id: 15197497471322645789
---

# Design System Specification: The Premium Messenger

## 1. Hệ thống Màu sắc & Thị giác
*   **Primary Blue (#004DB0):** Màu xanh chuyên nghiệp, có độ bão hòa cao cho các hành động chính.
*   **Surface Logic:** Sử dụng hệ thống 5 lớp Layer (Lowest -> Highest) để tạo chiều sâu mà không cần đổ bóng nặng. Tin nhắn người dùng luôn nằm ở Layer cao nhất (#FFFFFF).
*   **Không dùng Border:** Tuyệt đối không dùng đường kẻ 1px để phân cách. Sử dụng khoảng trắng (White-space) và đổ màu nền nhẹ (`#f3f3f7`) để phân khu vực Sidebar và Chat Window.

## 2. Typography (Hệ font Manrope)
*   **Headline:** Manrope Bold (32px, tracking -0.02em) cho tiêu đề lớn.
*   **Chat Text:** Manrope Regular (16px, line-height 1.5) để đảm bảo độ đọc tốt nhất.
*   **Metadata:** Manrope SemiBold (12px, All Caps, tracking 0.05em) cho thời gian và trạng thái.

## 3. Thành phần & Iconography
*   **Smart Bubbles:** 
    - Bo góc 16px mặc định.
    - Bo góc 4px ở góc dưới cùng bên phải (cho tin nhắn gửi đi) và dưới cùng bên trái (cho tin nhắn đến) để tạo sự kết nối với người gửi.
*   **Icon set:** Sử dụng hệ thống icon dạng Rounded, nét vẽ 1.5pt để đồng bộ với độ bo cong của font chữ.

## 4. Nguyên tắc thiết kế (Senior Do's & Don'ts)

### ✅ Nên làm (Do's):
1.  **Contextual Density:** Tự động điều chỉnh khoảng cách giữa các tin nhắn. Nhóm tin nhắn cùng người gửi trong 5 phút lại gần nhau (4px) và chỉ hiện Avatar ở tin nhắn cuối cùng để giảm nhiễu thị giác.
2.  **Micro-interactions:** Áp dụng hiệu ứng "Elastic" (co giãn) khi kéo danh sách và hiệu ứng "Lift-up" nhẹ khi hover vào bong bóng chat.
3.  **Progressive Disclosure:** Chỉ hiển thị các nút chức năng phụ (call, video, info) khi cần thiết. Ưu tiên không gian tối đa cho nội dung hội thoại.
4.  **High-Fidelity Empty States:** Thiết kế các trạng thái trống (khi chưa chọn chat) bằng minh họa cao cấp hoặc các gợi ý hành động tinh tế.
5.  **Skeleton Loaders:** Luôn có trạng thái chờ khớp chính xác với hình dạng của bong bóng chat để tránh hiện tượng giật cục (layout shift).

### ❌ Không được làm (Don'ts):
1.  **No Visual Debt:** Không dùng đường kẻ border đậm. Điều này làm giao diện trông rẻ tiền và lỗi thời.
2.  **Avoid Pure Greys:** Không dùng màu xám trung tính cho text phụ. Hãy dùng xám pha xanh (`#54606a`) để giữ được tone màu đặc trưng của thương hiệu.
3.  **Don't Break the Radius:** Không bao giờ dùng góc nhọn. Mọi thành phần từ ảnh đại diện đến nút bấm phải tuân thủ độ bo 8px (ROUND_EIGHT) hoặc 100% (Circle).
4.  **No Generic Placeholders:** Tuyệt đối không dùng avatar mặc định hình người màu xám. Hãy dùng initials (chữ cái đầu) với bảng màu được phối sẵn sang trọng.
5.  **Avoid Over-animation:** Không lạm dụng hiệu ứng chuyển cảnh quá 300ms. Hiệu ứng phải hỗ trợ người dùng, không được làm chậm tốc độ thao tác.
6.  **Don't Over-saturate:** Giữ nền trắng/xám cực nhạt để các nội dung đa phương tiện (ảnh, link) của người dùng thực sự nổi bật.
