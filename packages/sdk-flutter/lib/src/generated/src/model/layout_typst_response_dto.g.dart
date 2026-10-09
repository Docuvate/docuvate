// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_typst_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LayoutTypstResponseDto extends LayoutTypstResponseDto {
  @override
  final String typst;

  factory _$LayoutTypstResponseDto(
          [void Function(LayoutTypstResponseDtoBuilder)? updates]) =>
      (LayoutTypstResponseDtoBuilder()..update(updates))._build();

  _$LayoutTypstResponseDto._({required this.typst}) : super._();
  @override
  LayoutTypstResponseDto rebuild(
          void Function(LayoutTypstResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutTypstResponseDtoBuilder toBuilder() =>
      LayoutTypstResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutTypstResponseDto && typst == other.typst;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, typst.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutTypstResponseDto')
          ..add('typst', typst))
        .toString();
  }
}

class LayoutTypstResponseDtoBuilder
    implements Builder<LayoutTypstResponseDto, LayoutTypstResponseDtoBuilder> {
  _$LayoutTypstResponseDto? _$v;

  String? _typst;
  String? get typst => _$this._typst;
  set typst(String? typst) => _$this._typst = typst;

  LayoutTypstResponseDtoBuilder() {
    LayoutTypstResponseDto._defaults(this);
  }

  LayoutTypstResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _typst = $v.typst;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutTypstResponseDto other) {
    _$v = other as _$LayoutTypstResponseDto;
  }

  @override
  void update(void Function(LayoutTypstResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutTypstResponseDto build() => _build();

  _$LayoutTypstResponseDto _build() {
    final _$result = _$v ??
        _$LayoutTypstResponseDto._(
          typst: BuiltValueNullFieldError.checkNotNull(
              typst, r'LayoutTypstResponseDto', 'typst'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
