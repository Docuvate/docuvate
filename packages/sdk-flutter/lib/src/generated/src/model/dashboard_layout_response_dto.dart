//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/dashboard_widget_dto_class.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'dashboard_layout_response_dto.g.dart';

/// DashboardLayoutResponseDto
///
/// Properties:
/// * [widgets] 
/// * [editMode] 
@BuiltValue()
abstract class DashboardLayoutResponseDto implements Built<DashboardLayoutResponseDto, DashboardLayoutResponseDtoBuilder> {
  @BuiltValueField(wireName: r'widgets')
  BuiltList<DashboardWidgetDtoClass> get widgets;

  @BuiltValueField(wireName: r'editMode')
  bool get editMode;

  DashboardLayoutResponseDto._();

  factory DashboardLayoutResponseDto([void updates(DashboardLayoutResponseDtoBuilder b)]) = _$DashboardLayoutResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DashboardLayoutResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DashboardLayoutResponseDto> get serializer => _$DashboardLayoutResponseDtoSerializer();
}

class _$DashboardLayoutResponseDtoSerializer implements PrimitiveSerializer<DashboardLayoutResponseDto> {
  @override
  final Iterable<Type> types = const [DashboardLayoutResponseDto, _$DashboardLayoutResponseDto];

  @override
  final String wireName = r'DashboardLayoutResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DashboardLayoutResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'widgets';
    yield serializers.serialize(
      object.widgets,
      specifiedType: const FullType(BuiltList, [FullType(DashboardWidgetDtoClass)]),
    );
    yield r'editMode';
    yield serializers.serialize(
      object.editMode,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DashboardLayoutResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DashboardLayoutResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'widgets':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DashboardWidgetDtoClass)]),
          ) as BuiltList<DashboardWidgetDtoClass>;
          result.widgets.replace(valueDes);
          break;
        case r'editMode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.editMode = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DashboardLayoutResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DashboardLayoutResponseDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

