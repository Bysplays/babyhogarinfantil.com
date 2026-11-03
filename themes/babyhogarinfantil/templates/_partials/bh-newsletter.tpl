{if $page.page_name == 'index' || $page.page_name == 'category' || $page.page_name == 'product' || $page.page_name == 'new-products' || $page.page_name == 'prices-drop' || $page.page_name == 'search' || $page.page_name == 'manufacturer'}
<dialog id="bh-newsletter" class="bh-newsletter" aria-labelledby="bh-newsletter-title" aria-describedby="bh-newsletter-copy">
  <button type="button" class="bh-newsletter-close" aria-label="Cerrar newsletter">×</button>
  <span class="bh-newsletter-eyebrow">ELLOS CRECEN. TÚ TE ENTERAS PRIMERO.</span>
  <h2 id="bh-newsletter-title">Pequeñas novedades.<br>Grandes ventajas.</h2>
  <p id="bh-newsletter-copy">Suscríbete a nuestra newsletter y descubre descuentos, promociones exclusivas y nuevos lanzamientos antes que nadie.</p>
  <form action="{$link->getModuleLink('ps_emailsubscription', 'subscription')|escape:'htmlall':'UTF-8'}" method="post">
    <label for="bh-newsletter-email">Tu correo electrónico</label>
    <input id="bh-newsletter-email" name="email" type="email" autocomplete="email" placeholder="Tu correo electrónico" required maxlength="255">
    <input type="hidden" name="action" value="0">
    <input type="hidden" name="submitNewsletter" value="1">
    <p class="bh-newsletter-consent">Al suscribirte, aceptas recibir novedades y promociones de Baby Hogar Infantil. Podrás darte de baja cuando quieras.</p>
    <button type="submit" class="bh-newsletter-submit">Suscríbete</button>
    <p class="bh-newsletter-status" role="status" aria-live="polite"></p>
  </form>
  <label class="bh-newsletter-hide"><input type="checkbox" id="bh-newsletter-hide"> No volver a mostrar esta ventana</label>
</dialog>
{/if}
