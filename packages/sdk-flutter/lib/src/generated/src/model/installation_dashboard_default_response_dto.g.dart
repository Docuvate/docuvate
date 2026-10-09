// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'installation_dashboard_default_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$InstallationDashboardDefaultResponseDto
    extends InstallationDashboardDefaultResponseDto {
  @override
  final BuiltList<DashboardWidgetInputDto> widgets;

  factory _$InstallationDashboardDefaultResponseDto(
          [void Function(InstallationDashboardDefaultResponseDtoBuilder)?
              updates]) =>
      (new InstallationDashboardDefaultResponseDtoBuilder()..update(updates))
          ._build();

  _$InstallationDashboardDefaultResponseDto._({required this.widgets})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        widgets, r'InstallationDashboardDefaultResponseDto', 'widgets');
  }

  @override
  InstallationDashboardDefaultResponseDto rebuild(
          void Function(InstallationDashboardDefaultResponseDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  InstallationDashboardDefaultResponseDtoBuilder toBuilder() =>
      new InstallationDashboardDefaultResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is InstallationDashboardDefaultResponseDto &&
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
    return (newBuiltValueToStringHelper(
            r'InstallationDashboardDefaultResponseDto')
          ..add('widgets', widgets))
        .toString();
  }
}

class InstallationDashboardDefaultResponseDtoBuilder
    implements
        Builder<InstallationDashboardDefaultResponseDto,
            InstallationDashboardDefaultResponseDtoBuilder> {
  _$InstallationDashboardDefaultResponseDto? _$v;

  ListBuilder<DashboardWidgetInputDto>? _widgets;
  ListBuilder<DashboardWidgetInputDto> get widgets =>
      _$this._widgets ??= new ListBuilder<DashboardWidgetInputDto>();
  set widgets(ListBuilder<DashboardWidgetInputDto>? widgets) =>
      _$this._widgets = widgets;

  InstallationDashboardDefaultResponseDtoBuilder() {
    InstallationDashboardDefaultResponseDto._defaults(this);
  }

  InstallationDashboardDefaultResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _widgets = $v.widgets.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(InstallationDashboardDefaultResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$InstallationDashboardDefaultResponseDto;
  }

  @override
  void update(
      void Function(InstallationDashboardDefaultResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  InstallationDashboardDefaultResponseDto build() => _build();

  _$InstallationDashboardDefaultResponseDto _build() {
    _$InstallationDashboardDefaultResponseDto _$result;
    try {
      _$result = _$v ??
          new _$InstallationDashboardDefaultResponseDto._(
              widgets: widgets.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'widgets';
        widgets.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'InstallationDashboardDefaultResponseDto',
            _$failedField,
            e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
