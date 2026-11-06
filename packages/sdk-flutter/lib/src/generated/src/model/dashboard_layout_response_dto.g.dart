// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_layout_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DashboardLayoutResponseDto extends DashboardLayoutResponseDto {
  @override
  final BuiltList<DashboardWidgetDtoClass> widgets;
  @override
  final bool editMode;

  factory _$DashboardLayoutResponseDto(
          [void Function(DashboardLayoutResponseDtoBuilder)? updates]) =>
      (DashboardLayoutResponseDtoBuilder()..update(updates))._build();

  _$DashboardLayoutResponseDto._(
      {required this.widgets, required this.editMode})
      : super._();
  @override
  DashboardLayoutResponseDto rebuild(
          void Function(DashboardLayoutResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DashboardLayoutResponseDtoBuilder toBuilder() =>
      DashboardLayoutResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DashboardLayoutResponseDto &&
        widgets == other.widgets &&
        editMode == other.editMode;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, widgets.hashCode);
    _$hash = $jc(_$hash, editMode.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DashboardLayoutResponseDto')
          ..add('widgets', widgets)
          ..add('editMode', editMode))
        .toString();
  }
}

class DashboardLayoutResponseDtoBuilder
    implements
        Builder<DashboardLayoutResponseDto, DashboardLayoutResponseDtoBuilder> {
  _$DashboardLayoutResponseDto? _$v;

  ListBuilder<DashboardWidgetDtoClass>? _widgets;
  ListBuilder<DashboardWidgetDtoClass> get widgets =>
      _$this._widgets ??= ListBuilder<DashboardWidgetDtoClass>();
  set widgets(ListBuilder<DashboardWidgetDtoClass>? widgets) =>
      _$this._widgets = widgets;

  bool? _editMode;
  bool? get editMode => _$this._editMode;
  set editMode(bool? editMode) => _$this._editMode = editMode;

  DashboardLayoutResponseDtoBuilder() {
    DashboardLayoutResponseDto._defaults(this);
  }

  DashboardLayoutResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _widgets = $v.widgets.toBuilder();
      _editMode = $v.editMode;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DashboardLayoutResponseDto other) {
    _$v = other as _$DashboardLayoutResponseDto;
  }

  @override
  void update(void Function(DashboardLayoutResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DashboardLayoutResponseDto build() => _build();

  _$DashboardLayoutResponseDto _build() {
    _$DashboardLayoutResponseDto _$result;
    try {
      _$result = _$v ??
          _$DashboardLayoutResponseDto._(
            widgets: widgets.build(),
            editMode: BuiltValueNullFieldError.checkNotNull(
                editMode, r'DashboardLayoutResponseDto', 'editMode'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'widgets';
        widgets.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DashboardLayoutResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
