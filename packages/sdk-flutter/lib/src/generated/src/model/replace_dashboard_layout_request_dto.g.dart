// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'replace_dashboard_layout_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReplaceDashboardLayoutRequestDto
    extends ReplaceDashboardLayoutRequestDto {
  @override
  final BuiltList<DashboardWidgetInputDto> widgets;

  factory _$ReplaceDashboardLayoutRequestDto(
          [void Function(ReplaceDashboardLayoutRequestDtoBuilder)? updates]) =>
      (ReplaceDashboardLayoutRequestDtoBuilder()..update(updates))._build();

  _$ReplaceDashboardLayoutRequestDto._({required this.widgets}) : super._();
  @override
  ReplaceDashboardLayoutRequestDto rebuild(
          void Function(ReplaceDashboardLayoutRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReplaceDashboardLayoutRequestDtoBuilder toBuilder() =>
      ReplaceDashboardLayoutRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReplaceDashboardLayoutRequestDto &&
        widgets == other.widgets;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, widgets.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReplaceDashboardLayoutRequestDto')
          ..add('widgets', widgets))
        .toString();
  }
}

class ReplaceDashboardLayoutRequestDtoBuilder
    implements
        Builder<ReplaceDashboardLayoutRequestDto,
            ReplaceDashboardLayoutRequestDtoBuilder> {
  _$ReplaceDashboardLayoutRequestDto? _$v;

  ListBuilder<DashboardWidgetInputDto>? _widgets;
  ListBuilder<DashboardWidgetInputDto> get widgets =>
      _$this._widgets ??= ListBuilder<DashboardWidgetInputDto>();
  set widgets(ListBuilder<DashboardWidgetInputDto>? widgets) =>
      _$this._widgets = widgets;

  ReplaceDashboardLayoutRequestDtoBuilder() {
    ReplaceDashboardLayoutRequestDto._defaults(this);
  }

  ReplaceDashboardLayoutRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _widgets = $v.widgets.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReplaceDashboardLayoutRequestDto other) {
    _$v = other as _$ReplaceDashboardLayoutRequestDto;
  }

  @override
  void update(void Function(ReplaceDashboardLayoutRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReplaceDashboardLayoutRequestDto build() => _build();

  _$ReplaceDashboardLayoutRequestDto _build() {
    _$ReplaceDashboardLayoutRequestDto _$result;
    try {
      _$result = _$v ??
          _$ReplaceDashboardLayoutRequestDto._(
            widgets: widgets.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'widgets';
        widgets.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ReplaceDashboardLayoutRequestDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
