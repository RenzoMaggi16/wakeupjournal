## Table `rules`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `user_id` | `uuid` |  Nullable |
| `rule_text` | `text` |  Nullable |
| `descripcion` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `strategy_id` | `uuid` |  Nullable |

## Table `trades`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `user_id` | `uuid` |  Nullable |
| `par` | `text` |  Nullable |
| `pnl_neto` | `numeric` |  Nullable |
| `riesgo` | `numeric` |  Nullable |
| `created_at` | `timestamptz` |  |
| `imagenes_urls` | `_text` |  Nullable |
| `emocion` | `text` |  Nullable |
| `trade_type` | `text` |  Nullable |
| `entry_time` | `timestamptz` |  Nullable |
| `exit_time` | `timestamptz` |  Nullable |
| `pre_trade_notes` | `text` |  Nullable |
| `post_trade_notes` | `text` |  Nullable |
| `setup_rating` | `text` |  Nullable |
| `account_id` | `uuid` |  Nullable |
| `strategy_id` | `uuid` |  Nullable |
| `image_url_m1` | `text` |  Nullable |
| `image_url_m5` | `text` |  Nullable |
| `image_url_m15` | `text` |  Nullable |
| `is_outside_plan` | `bool` |  Nullable |
| `setup_compliance` | `text` |  Nullable |
| `is_trade_of_day` | `bool` |  Nullable |
| `trade_of_day_image` | `text` |  Nullable |
| `trade_of_day_notes` | `text` |  Nullable |
| `entry_types` | `_text` |  Nullable |
| `tradovate_fill_id` | `text` |  Nullable |
| `is_be` | `bool` |  Nullable |

## Table `strategies`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Nullable |
| `name` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `accounts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `account_name` | `text` |  |
| `account_type` | `text` |  |
| `asset_class` | `text` |  |
| `initial_capital` | `numeric` |  |
| `current_capital` | `numeric` |  |
| `funding_company` | `text` |  Nullable |
| `funding_phases` | `int4` |  Nullable |
| `created_at` | `timestamptz` |  |
| `funding_target_1` | `numeric` |  Nullable |
| `funding_target_2` | `numeric` |  Nullable |
| `drawdown_type` | `text` |  Nullable |
| `drawdown_amount` | `numeric` |  Nullable |
| `profit_target` | `numeric` |  Nullable |
| `highest_balance` | `numeric` |  Nullable |
| `loss_limit` | `numeric` |  Nullable |
| `consistency_min_profit_days` | `int4` |  Nullable |
| `consistency_withdrawal_pct` | `numeric` |  Nullable |
| `evaluation_passed` | `bool` |  Nullable |
| `evaluation_passed_at` | `timestamptz` |  Nullable |
| `funding_firm_id` | `text` |  Nullable |

## Table `user_preferences`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Unique |
| `profit_color_hex` | `text` |  Nullable |
| `loss_color_hex` | `text` |  Nullable |
| `updated_at` | `timestamptz` |  |
| `chart_color_hex` | `text` |  Nullable |

## Table `broken_rules_by_trade`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `trade_id` | `int8` |  Nullable |
| `rule_id` | `int8` |  Nullable |
| `user_id` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `trading_plans`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Unique |
| `market` | `text` |  Nullable |
| `instrument` | `text` |  Nullable |
| `trading_type` | `text` |  Nullable |
| `session` | `text` |  Nullable |
| `allowed_hours_start` | `time` |  Nullable |
| `allowed_hours_end` | `time` |  Nullable |
| `risk_per_trade` | `numeric` |  Nullable |
| `max_daily_risk` | `numeric` |  Nullable |
| `max_trades_per_day` | `int4` |  Nullable |
| `min_rr` | `numeric` |  Nullable |
| `stop_after_consecutive_losses` | `int4` |  Nullable |
| `psychological_rules` | `jsonb` |  Nullable |
| `setup_rules` | `jsonb` |  Nullable |
| `monthly_goals` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `daily_psychology_messages`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `message` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `payouts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `account_id` | `uuid` |  |
| `amount` | `numeric` |  |
| `payout_date` | `timestamptz` |  |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `mentor_chat_messages`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `role` | `text` |  |
| `content` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `entry_types`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `name` | `text` |  |
| `color` | `text` |  |
| `usage_count` | `int4` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `tradovate_connections`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Unique |
| `access_token` | `text` |  Nullable |
| `token_expiry` | `timestamptz` |  Nullable |
| `tradovate_user_id` | `int4` |  Nullable |
| `tradovate_environment` | `text` |  Nullable |
| `accounts_cache` | `jsonb` |  Nullable |
| `last_sync_at` | `timestamptz` |  Nullable |
| `last_sync_fill_id` | `int4` |  Nullable |
| `status` | `text` |  Nullable |
| `error_message` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

