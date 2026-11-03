{if $bag.products_count == 0}
  <div class="bh-bag-empty"><h3>Aún está por llenar.</h3><p>Encuentra esa prenda que le acompañará en su próxima aventura.</p><a class="button" href="{$bag_catalog|escape:'htmlall':'UTF-8'}">Descubrir colección ↗</a></div>
{else}
  <p class="bh-bag-count">{$bag.products_count} {if $bag.products_count == 1}artículo{else}artículos{/if} en tu bolsa</p>
  <ul class="bh-bag-products">
  {foreach from=$bag.products item=product}
    <li class="bh-bag-product">
      <a href="{$product.url|escape:'htmlall':'UTF-8'}"><img src="{$product.cover.bySize.cart_default.url|default:$product.cover.small.url|escape:'htmlall':'UTF-8'}" alt="{$product.name|escape:'htmlall':'UTF-8'}" width="100" height="100"></a>
      <div><a class="bh-bag-name" href="{$product.url|escape:'htmlall':'UTF-8'}">{$product.name|escape:'htmlall':'UTF-8'}</a>
      {foreach from=$product.attributes key=label item=value}<p class="bh-bag-attribute">{$label|escape:'htmlall':'UTF-8'}: {$value|escape:'htmlall':'UTF-8'}</p>{/foreach}
      <strong>{$product.total|escape:'htmlall':'UTF-8'}</strong>
      <div class="bh-bag-actions">
      {if empty($product.is_gift)}
        <div class="bh-bag-quantity"><button type="button" data-bag-action="{$product.down_quantity_url|escape:'htmlall':'UTF-8'}" aria-label="Reducir cantidad de {$product.name|escape:'htmlall':'UTF-8'}" {if $product.quantity <= 1}disabled{/if}>−</button><span aria-label="Cantidad">{$product.quantity}</span><button type="button" data-bag-action="{$product.up_quantity_url|escape:'htmlall':'UTF-8'}" aria-label="Aumentar cantidad de {$product.name|escape:'htmlall':'UTF-8'}">+</button></div>
        <button type="button" class="bh-bag-remove" data-bag-action="{$product.remove_from_cart_url|escape:'htmlall':'UTF-8'}" aria-label="Eliminar {$product.name|escape:'htmlall':'UTF-8'}">Eliminar</button>
      {else}<span>Cantidad: {$product.quantity}</span>{/if}
      </div></div>
    </li>
  {/foreach}
  </ul>
  <div class="bh-bag-totals">
    {foreach from=$bag.subtotals item=subtotal}{if $subtotal}<div><span>{$subtotal.label|escape:'htmlall':'UTF-8'}</span><span>{$subtotal.value|escape:'htmlall':'UTF-8'}</span></div>{/if}{/foreach}
    <div class="bh-bag-total"><strong>{$bag.totals.total.label|escape:'htmlall':'UTF-8'}</strong><strong>{$bag.totals.total.value|escape:'htmlall':'UTF-8'}</strong></div>
  </div>
  <a class="button bh-bag-checkout" href="{$bag_checkout|escape:'htmlall':'UTF-8'}">Finalizar compra ↗</a>
  <a class="bh-bag-full" href="{$bag_cart|escape:'htmlall':'UTF-8'}">Ver y editar la bolsa</a>
{/if}
