{block name='product_flags'}
<ul class="product-flags js-product-flags">
{foreach from=$product.flags item=flag}
  <li class="product-flag {$flag.type}">{if ($flag.type == 'discount' || $flag.type == 'discount-amount' || $flag.type == 'discount-percentage') && $product.has_discount && $product.regular_price_amount > 0}{assign var=bh_discount_percent value=(100 * ($product.regular_price_amount - $product.price_amount) / $product.regular_price_amount)}−{$bh_discount_percent|round:0} %{else}{$flag.label}{/if}</li>
{/foreach}
</ul>
{/block}